import { beff } from "./utils/beff";

export function Greeting() {
  const greeting = beff["/greeting"].get("beff user").useQuery();

  return <div>{greeting.data?.text}</div>;
}
