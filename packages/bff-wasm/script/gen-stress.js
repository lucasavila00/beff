const row = (s) =>
  `["/a${s}/{id}"]: { get: async (id: string): Promise<string> => todo(),post: async (id: string): Promise<string> => todo(), },`;

const N = 1000;

const keys = Array.from({ length: N }, (_, i) => i + 1)
  .map((i) => {
    const s = i.toString();
    return row(s);
  })
  .join("\n");

console.log(keys);
