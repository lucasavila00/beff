export default {
  [`GET/hello1`]: async (): Promise<string> => {
    return "Hello!";
  },
  [`GET/hello2`]: async function (): Promise<string> {
    return "Hello!";
  },
  [`GET/hello3`]: function (): Promise<string> {
    return Promise.resolve("Hello!");
  },
  [`GET/hello4`]: function (): string {
    return "Hello!";
  },
  [`GET/hello5`]: (): string => "Hello!",
};
