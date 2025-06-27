import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import NavItems from "./NavItems";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between mx-auto w-full px-14 py-4 bg-white max-sm:px-4">
      <div className="flex items-center gap-2.5 cursor-pointer">
        <Link href="/">
          <Image src="/favicon.ico" alt="Konvoko" width={32} height={32} />
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <SignedOut>
          <Link href="/sign-in">Sign In</Link>
          <Link href="/sign-up">Sign Up</Link>
        </SignedOut>
        <SignedIn>
          <NavItems />
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
