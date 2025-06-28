import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center lg:pt-24">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
              card: "shadow-lg rounded-lg",
              headerTitle: "text-2xl font-bold text-gray-900",
              headerSubtitle: "text-gray-600",
              socialButtonsBlockButton:
                "border border-gray-300 hover:bg-gray-50",
              formFieldInput:
                "border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              footerActionLink: "text-blue-600 hover:text-blue-700",
            },
          }}
        />
      </div>
    </div>
  );
}
