// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadDataset } from "./dataset";
import { parsePrivateKey, parsePublicKey, signDocument } from "./signing";
import { stripServerFields, type FetchItem } from "./technoworks";

type Doc = Record<string, unknown>;
type Items = Record<string, Doc>;
type Entry = { key: string; ref: string; signature: string };

const readFixture = (name: string): unknown =>
  JSON.parse(readFileSync(join(process.cwd(), "test-vectors", name), "utf8"));

const fixture = readFixture("dataset.json") as { publicKeyHex: string; indexRef: string; items: Items };
const signing = readFixture("signing.json") as { privateKeySeedHex: string };

const privateKey = parsePrivateKey(signing.privateKeySeedHex);
const publicKey = parsePublicKey(fixture.publicKeyHex);

const cloneItems = (): Items => structuredClone(fixture.items);
const fetcherFor = (items: Items): FetchItem => async (reference) =>
  items[reference] ? structuredClone(items[reference]) : null;
const load = (items: Items) =>
  loadDataset({ fetchItem: fetcherFor(items), publicKey, indexRef: fixture.indexRef });

const indexOf = (items: Items): Doc => items[fixture.indexRef] as Doc;
const entriesOf = (items: Items): Entry[] => indexOf(items).bundles as Entry[];
const firstBundleRef = (items: Items): string => (entriesOf(items)[0] as Entry).ref;

type Tweak = {
  documents?: (documents: Doc[]) => Doc[];
  signDocuments?: boolean;
  bundle?: (bundle: Doc) => Doc;
  updateIndex?: boolean;
  index?: (index: Doc) => Doc;
};

/** Rewrites the first bundle and re-signs with the test key, as a real push (or an attacker with the key) would. */
function rewrite(items: Items, tweak: Tweak): void {
  const reference = firstBundleRef(items);
  let bundle = stripServerFields(items[reference] as Doc);

  if (tweak.documents) {
    const unsigned = (bundle.documents as Doc[]).map(({ signature: _signature, ...rest }) => rest);
    const changed = tweak.documents(unsigned);
    bundle = {
      ...bundle,
      documents: tweak.signDocuments === false ? changed : changed.map((document) => signDocument(document, privateKey)),
    };
  }
  if (tweak.bundle) {
    bundle = tweak.bundle(bundle);
  }
  const signedBundle = signDocument(bundle, privateKey);
  items[reference] = signedBundle;

  let index = stripServerFields(indexOf(items));
  if (tweak.updateIndex !== false) {
    index = {
      ...index,
      bundles: entriesOf(items).map((entry) =>
        entry.ref === reference ? { ...entry, signature: signedBundle.signature } : entry,
      ),
    };
  }
  if (tweak.index) {
    index = tweak.index(index);
  }
  items[fixture.indexRef] = signDocument(index, privateKey);
}

const findDocument = (documents: Doc[], type: string): Doc => documents.find((document) => document.type === type) as Doc;

describe("loadDataset", () => {
  it("loads the dataset produced by the Rust tool", async () => {
    const dataset = await load(cloneItems());
    expect(dataset.generatedAt).toBe(1_700_000_000);
    expect(dataset.exams.map((exam) => exam.slug)).toEqual(["fuvest"]);
    expect(dataset.events.map((event) => event.id)).toEqual(["pvb-event-fuvest-2027-phase-1"]);
    expect(dataset.exams[0]).not.toHaveProperty("signature");
  });

  it("fails when the index is missing", async () => {
    const items = cloneItems();
    delete items[fixture.indexRef];
    await expect(load(items)).rejects.toThrow("The index was not found.");
  });

  it("fails when the index was changed without the key", async () => {
    const items = cloneItems();
    indexOf(items).generatedAt = 1;
    await expect(load(items)).rejects.toThrow("The index has an invalid signature.");
  });

  it("fails when a signed index has an unexpected format", async () => {
    const items = cloneItems();
    rewrite(items, { index: (index) => ({ ...index, formatVersion: 2 }) });
    await expect(load(items)).rejects.toThrow("The index has an unexpected format");
  });

  it("fails when the index lists the same bundle twice", async () => {
    const items = cloneItems();
    rewrite(items, {
      index: (index) => {
        const [first] = index.bundles as Entry[];
        return { ...index, bundles: [first, first] };
      },
    });
    await expect(load(items)).rejects.toThrow("The index lists the same bundle twice.");
  });

  it("fails when a bundle is missing", async () => {
    const items = cloneItems();
    delete items[firstBundleRef(items)];
    await expect(load(items)).rejects.toThrow('Bundle "fuvest" was not found.');
  });

  it("fails when a bundle was changed without the key", async () => {
    const items = cloneItems();
    (items[firstBundleRef(items)] as Doc).formatVersion = 2;
    await expect(load(items)).rejects.toThrow('Bundle "fuvest" has an invalid signature.');
  });

  it("fails when a valid bundle is not the one listed in the index", async () => {
    const items = cloneItems();
    rewrite(items, {
      documents: (documents) =>
        documents.map((document) => (document.type === "event" ? { ...document, label: "Outra" } : document)),
      updateIndex: false,
    });
    await expect(load(items)).rejects.toThrow('Bundle "fuvest" is not the one listed in the index.');
  });

  it("fails when a signed bundle has an unexpected format", async () => {
    const items = cloneItems();
    rewrite(items, { bundle: (bundle) => ({ ...bundle, documents: [] }) });
    await expect(load(items)).rejects.toThrow('Bundle "fuvest" has an unexpected format');
  });

  it("fails when a bundle is labeled as another exam", async () => {
    const items = cloneItems();
    rewrite(items, { bundle: (bundle) => ({ ...bundle, bundle: "unicamp" }) });
    await expect(load(items)).rejects.toThrow('Bundle "fuvest" is labeled as a different exam.');
  });

  it("fails when a document has no valid signature", async () => {
    const items = cloneItems();
    rewrite(items, { documents: (documents) => documents, signDocuments: false });
    await expect(load(items)).rejects.toThrow('A document in Bundle "fuvest" has an invalid signature.');
  });

  it("fails when a signed exam breaks the rules", async () => {
    const items = cloneItems();
    rewrite(items, {
      documents: (documents) =>
        documents.map((document) => (document.type === "exam" ? { ...document, officialName: " " } : document)),
    });
    await expect(load(items)).rejects.toThrow('Exam in Bundle "fuvest" is invalid');
  });

  it("fails when a signed event breaks the rules", async () => {
    const items = cloneItems();
    rewrite(items, {
      documents: (documents) =>
        documents.map((document) => (document.type === "event" ? { ...document, endDate: "2027-01-01" } : document)),
    });
    await expect(load(items)).rejects.toThrow('Event in Bundle "fuvest" is invalid');
  });

  it("fails when an exam belongs to another bundle", async () => {
    const items = cloneItems();
    rewrite(items, {
      documents: (documents) =>
        documents.map((document) =>
          document.type === "exam" ? { ...document, slug: "unicamp", id: "pvb-exam-unicamp" } : document,
        ),
    });
    await expect(load(items)).rejects.toThrow('An exam in Bundle "fuvest" belongs to another exam.');
  });

  it("fails when an event belongs to another bundle", async () => {
    const items = cloneItems();
    rewrite(items, {
      documents: (documents) =>
        documents.map((document) =>
          document.type === "event"
            ? { ...document, examSlug: "unicamp", id: "pvb-event-unicamp-2027-phase-1" }
            : document,
        ),
    });
    await expect(load(items)).rejects.toThrow('An event in Bundle "fuvest" belongs to another exam.');
  });

  it("fails on an unknown document type", async () => {
    const items = cloneItems();
    rewrite(items, { documents: (documents) => [...documents, { type: "school", id: "pvb-school-x" }] });
    await expect(load(items)).rejects.toThrow('Bundle "fuvest" contains an unknown document type.');
  });

  it("fails when a bundle has no exam", async () => {
    const items = cloneItems();
    rewrite(items, { documents: (documents) => documents.filter((document) => document.type !== "exam") });
    await expect(load(items)).rejects.toThrow('Bundle "fuvest" must contain exactly one exam.');
  });

  it("fails when two documents share an id", async () => {
    const items = cloneItems();
    rewrite(items, { documents: (documents) => [...documents, findDocument(documents, "event")] });
    await expect(load(items)).rejects.toThrow("Two documents share the same id.");
  });
});

describe("loadDataset with editions and structures", () => {
  it("loads the edition and structure produced by the Rust tool", async () => {
    const dataset = await load(cloneItems());
    expect(dataset.editions.map((edition) => edition.id)).toEqual(["pvb-edition-fuvest-2027"]);
    expect(dataset.structures.map((structure) => structure.id)).toEqual(["pvb-structure-fuvest-2027"]);
  });

  it("fails when a signed edition breaks the rules", async () => {
    const items = cloneItems();
    rewrite(items, {
      documents: (documents) =>
        documents.map((document) => (document.type === "edition" ? { ...document, feeCents: -1 } : document)),
    });
    await expect(load(items)).rejects.toThrow('Edition in Bundle "fuvest" is invalid');
  });

  it("fails when a structure belongs to another exam", async () => {
    const items = cloneItems();
    rewrite(items, {
      documents: (documents) =>
        documents.map((document) =>
          document.type === "structure"
            ? { ...document, examSlug: "unicamp", id: "pvb-structure-unicamp-2027" }
            : document,
        ),
    });
    await expect(load(items)).rejects.toThrow('A structure in Bundle "fuvest" belongs to another exam.');
  });
});
