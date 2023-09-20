import { ThemeChanger } from "@/components/theme-changer";
import {
  Flex,
  Text,
  Button,
  ThemePanel,
  Blockquote,
  Box,
  Card,
  IconButton,
} from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
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
          {/* <Button variant="ghost">Edit profile</Button>
          <Button variant="ghost">Edit profile</Button>
          <Button variant="ghost">Edit profile</Button>
          <Button variant="ghost">Edit profile</Button>
          <Button variant="ghost">Edit profile</Button> */}
        </Flex>
        <Box pr="2">
          <IconButton>
            <MagnifyingGlassIcon width="18" height="18" />
          </IconButton>
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
        <Button>Lets go</Button>
        <Blockquote>
          Perfect typography is certainly the most elusive of all arts.
          Sculpture in stone alone comes near it in obstinacy.
        </Blockquote>
        <ThemeChanger />
      </Flex>
    </>
  );
}
