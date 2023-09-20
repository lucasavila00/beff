import { Flex, Text, Button, Blockquote, Box } from "@radix-ui/themes";
import { CaretDownIcon } from "@radix-ui/react-icons";
import { UserButton } from "@/components/user-button";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

const ConnectedUserButton = async () => {
  const session = await getServerSession(authOptions);

  if (session == null) {
    return <></>;
  }
  return <UserButton session={session} />;
};
const NavBar = () => {
  const height = "8";
  return (
    <>
      <Flex
        width="100%"
        position="fixed"
        height={height}
        className="bg-panel border-b border-gray-4"
        align="center"
        justify="between"
      >
        <Box pl="3">
          <Text size="3" weight="bold">
            Diff
          </Text>
        </Box>
        <Flex gap="4">
          <Button variant="ghost">
            D1 Northwind
            <CaretDownIcon width="16" height="16" />
          </Button>
        </Flex>
        <Box pr="2">
          <ConnectedUserButton />
        </Box>
      </Flex>
      <Box height={height} />
    </>
  );
};

export default function Home() {
  return (
    <>
      <NavBar />
      <Flex direction="column" gap="2">
        <Text>Hello from Radix Themes :)</Text>
        <Blockquote>
          Perfect typography is certainly the most elusive of all arts.
          Sculpture in stone alone comes near it in obstinacy.
        </Blockquote>
      </Flex>
    </>
  );
}
