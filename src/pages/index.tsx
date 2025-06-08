import { Button, Center, Divider, Tooltip } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <main className="p-[16px] h-full flex flex-col">
      {/* TITLE */}
      <h2 className="text-[24px] italic font-semibold">Reinforced Concrete Design</h2>
      <h3>
        <Link href={"https://github.com/ghkvuddl/reinforced-concrete"} style={{ textDecoration: "underline" }}>
          🔗https://github.com/ghkvuddl/reinforced-concrete
        </Link>
      </h3>
      <Divider className="my-[16px]" />

      {/* CONTENT */}
      <Center className="flex-grow flex-col gap-8 *:w-[220px]">
        <Tooltip label="보 설계 시트">
          <Button onClick={() => router.push("/beam")} colorScheme="blue">
            Beam Design Sheet
          </Button>
        </Tooltip>

        <Tooltip label="보 역설계 시트">
          <Button onClick={() => router.push("/beam-reversed")} colorScheme="blue">
            teehS ngiseD maeB
          </Button>
        </Tooltip>

        <Tooltip label="기둥 설계 시트">
          <Button onClick={() => router.push("/column")} colorScheme="blue">
            Column Design Sheet
          </Button>
        </Tooltip>

        <Tooltip label="기둥 역설계 시트">
          <Button onClick={() => router.push("/column-reversed")} colorScheme="blue">
            teehS ngiseD nmuloC
          </Button>
        </Tooltip>
      </Center>

      {/* FOOTER */}
      <footer className="flex flex-col justify-end gap-4 sm:flex-row">
        <p className="text-[14px]">✉️snsshvdl9820@gmail.com</p>
        <p className="font-semibold text-[14px] italic">©{new Date().getFullYear()} Hwapyeong Lee </p>
      </footer>
    </main>
  );
}
