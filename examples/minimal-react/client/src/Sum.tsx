import React from "react";
import { beff } from "./utils/beff";

export function Sum() {
  const [a, setA] = React.useState(1);
  const [b, setB] = React.useState(2);
  const queryResult = beff["/sum"].get(a, b).useQuery();

  return (
    <div
      style={{
        marginTop: 40,
      }}
    >
      <p>
        <b>Calculator</b>
      </p>
      <p>Try setting an invalid value and check devtools</p>
      <div>
        A: <input value={a} onChange={(e) => setA(e.target.value as any)} />
      </div>
      <div>
        B: <input value={b} onChange={(e) => setB(e.target.value as any)} />
      </div>
      <p>A+B:{queryResult.data?.result}</p>
      <p>Status: {queryResult.status}</p>
    </div>
  );
}
