import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Greeting } from "./Greeting";

const queryClient = new QueryClient();
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Greeting />
    </QueryClientProvider>
  );
}
