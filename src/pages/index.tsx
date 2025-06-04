import { Button, Center, Divider } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <main className="p-[16px] h-full flex flex-col">
      {/* TITLE */}
      <h2 className="text-[24px] italic">Reinforced Concrete Design</h2>
      <Divider className="my-[16px]" />

      {/* CONTENT */}
      <Center className="flex-grow flex-col gap-8 *:w-[220px]">
        <Button onClick={() => router.push("/beam")} colorScheme="blue">
          Beam Design Sheet
        </Button>

        <Button onClick={() => router.push("/beam-reversed")} colorScheme="blue">
          teehS ngiseD maeB
        </Button>

        <Button onClick={() => router.push("/column")} colorScheme="blue">
          Column Design Sheet
        </Button>

        <Button onClick={() => router.push("/column-reversed")} colorScheme="blue">
          teehS ngiseD nmuloC
        </Button>
      </Center>

      {/* FOOTER */}
      <footer className="flex flex-col justify-end gap-4 sm:flex-row">
        <p>✉️ snsshvdl9820@gmail.com</p>
        <Link href={"https://github.com/ghkvuddl/reinforced-concrete"} style={{ textDecoration: "underline" }}>
          🔗https://github.com/ghkvuddl/reinforced-concrete
        </Link>
      </footer>
    </main>
  );
}
