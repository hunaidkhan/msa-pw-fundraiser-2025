import Link from "next/link";

export default function ThankYouPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold">Thank you for your support!</h1>
      <p className="text-lg text-muted-foreground">
        Your payment was processed successfully. We appreciate your contribution.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        Back Home
      </Link>
    </main>
  );
}
