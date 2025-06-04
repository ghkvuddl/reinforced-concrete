import { Button, Center, Divider } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <main className="p-[16px] h-full flex flex-col">
      {/* TITLE */}
      <h2 className="text-[24px]">Design and Construction of Structural Concrete 2</h2>
      <Divider className="my-[16px]" />

      {/* CONTENT */}
      <Center className="flex-grow flex-col gap-8">
        <Button onClick={() => router.push("/beam")} colorScheme="blue">
          Beam or Slab Design Sheet
        </Button>

        <Button onClick={() => router.push("/column")} colorScheme="blue">
          Column or Wall Design Sheet
        </Button>
      </Center>

      {/* FOOTER */}
      <footer className="flex justify-end">
        <Link href={"https://github.com/ghkvuddl/reinforced-concrete"}>
          🔗: https://github.com/ghkvuddl/reinforced-concrete
        </Link>
      </footer>
    </main>
  );
}
