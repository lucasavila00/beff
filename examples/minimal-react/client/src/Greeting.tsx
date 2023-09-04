import { beff } from "./utils/beff";

export function Greeting() {
  const greeting = beff["/greeting"].get("tRPC user").useQuery();

  return <div>{greeting.data?.text}</div>;
}
