import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Greeting } from "./Greeting";
import { Sum } from "./Sum";

const queryClient = new QueryClient();
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Greeting />
      <Sum />
    </QueryClientProvider>
  );
}
