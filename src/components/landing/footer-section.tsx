import Link from "next/link";
import { FaXTwitter, FaGithub, FaLinkedin } from "react-icons/fa6";
import { MdMail } from "react-icons/md";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { IconHandStop } from "@tabler/icons-react";

export function FooterSection() {
  return (
    <footer className="relative bg-background text-muted-foreground overflow-hidden border-t">
      {/* Animated Grid Pattern Background */}
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={5}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
        )}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <div className="text-primary-foreground font-bold text-lg">
                  G
                </div>
              </div>
              <div className="text-xl font-bold text-foreground">GrabLink</div>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
              The complete Next.js starter kit with Polar.sh payments, Better
              Auth authentication, and Postgres database. Build modern web
              applications faster.
            </p>
            <div className="text-muted-foreground text-sm mb-4">
              Copyright © {new Date().getFullYear()} - All rights reserved
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://x.com/prosamik"
                  aria-label="Twitter"
                  className="text-muted-foreground hover:text-primary"
                >
                  <FaXTwitter className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://github.com/prosamik"
                  aria-label="GitHub"
                  className="text-muted-foreground hover:text-primary"
                >
                  <FaGithub className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://linkedin.com/in/prosamik"
                  aria-label="LinkedIn"
                  className="text-muted-foreground hover:text-primary"
                >
                  <FaLinkedin className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="mailto:dev.samikc@gmail.com"
                  aria-label="Email"
                  className="text-muted-foreground hover:text-primary"
                >
                  <MdMail className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-6 text-sm uppercase tracking-wider">
              Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/pricing"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-6 text-sm uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Terms of services
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>

          {/* More Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-6 text-sm uppercase tracking-wider">
              More
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://prosamik.com"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Solopreneur Toolkit
                </a>
              </li>
              <li>
                <a
                  href="https://mapyourideas.com"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  AI idea organizer
                </a>
              </li>
              <li>
                <a
                  href="https://githubme.com"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Convert Markdown to Landing Page
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Author Section */}
        <div className="border-t border-border pt-8 flex items-center text-muted-foreground text-sm">
          <div className="w-8 h-8 bg-orange-500 rounded-full mr-3 flex items-center justify-center">
            <IconHandStop className="h-5 w-5 text-white" />
          </div>
          Hey Curious{" "}
          <IconHandStop className="h-5 w-5 text-orange-500 inline-block mx-1" />{" "}
          I&apos;m{" "}
          <a
            href="https://prosamik.com"
            className="text-muted-foreground underline mx-1 hover:text-primary"
          >
            Samik
          </a>
          , the creator of this Next.js starter kit. You can follow my work on
          <a
            href="https://youtube.com/@prosamik"
            className="text-muted-foreground underline ml-1 hover:text-primary"
          >
            YouTube
          </a>
        </div>
      </div>
    </footer>
  );
}
