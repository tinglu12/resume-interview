import Link from "next/link";

export function NavCta({ signedIn }: { signedIn: boolean }) {
  if (signedIn) {
    return (
      <Link
        href="/dashboard"
        className="font-sans text-[13.5px] font-semibold text-primary-foreground bg-foreground rounded-lg px-[18px] py-[9px] hover:opacity-90"
      >
        Go to Resume Builder
      </Link>
    );
  }
  return (
    <>
      <Link href="/sign-in" className="text-[13.5px] text-muted-foreground hover:text-foreground">
        Log in
      </Link>
      <Link
        href="/sign-up"
        className="font-sans text-[13.5px] font-semibold text-primary-foreground bg-foreground rounded-lg px-[18px] py-[9px] hover:opacity-90"
      >
        Get started
      </Link>
    </>
  );
}
