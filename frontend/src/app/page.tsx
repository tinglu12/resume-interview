import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEdgeStripeBackground } from "@/features/resume-builder/lib/blockTypeEdge";
import { NavCta } from "./NavCta";

export default async function Home() {
  const { userId } = await auth();
  const signedIn = Boolean(userId);

  return (
    <div className="bg-background text-foreground font-sans">
      {/* NAV */}
      <div className="sticky top-0 z-10 bg-background border-b border-hairline flex items-center justify-between px-14 py-4">
        <div className="flex items-center gap-2">
          <div className="w-[18px] h-[18px] bg-foreground rounded-[5px]" />
          <span className="font-bold text-base">Blocks</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#how-it-works" className="text-[13.5px] text-muted-foreground hover:text-foreground">
            How it works
          </a>
          <a href="#ai-generation" className="text-[13.5px] text-muted-foreground hover:text-foreground">
            AI generation
          </a>
          <NavCta signedIn={signedIn} />
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-[1280px] mx-auto px-14 pt-22 pb-16 grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
        <div>
          <div className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-[18px]">
            A resume builder for people applying more than once
          </div>
          <h1 className="font-sans font-bold text-[52px] leading-[1.08] tracking-[-0.02em] mb-[22px] text-balance">
            The library is the product.
            <br />
            The resume is a rendering.
          </h1>
          <p className="text-[17px] leading-[1.6] text-muted-foreground max-w-[460px] mb-8">
            Write each job, project, and skill group once as a block. Assemble as many
            targeted resumes as you need from the same library. Edit a block, and every
            resume using it updates — nothing to copy-paste, nothing to keep in sync by
            hand.
          </p>
          <div className="flex gap-3 items-center">
            <Link
              href={signedIn ? "/dashboard" : "/sign-up"}
              className="font-sans text-[14.5px] font-semibold text-primary-foreground bg-foreground rounded-lg px-[22px] py-[13px] hover:opacity-90"
            >
              Upload your resume
            </Link>
            <a href="#how-it-works" className="text-[13.5px] text-muted-foreground hover:text-foreground">
              See how it works →
            </a>
          </div>
        </div>
        <div className="relative h-[420px] hidden md:block">
          <div className="absolute top-0 right-5 w-[300px] bg-background border border-hairline shadow-xl px-6 py-[26px]">
            <div className="font-serif font-semibold text-xl text-foreground mb-0.5">
              Priya Raghunathan
            </div>
            <div className="text-[10.5px] text-muted-foreground mb-[18px]">
              priya@email.com · San Francisco, CA
            </div>
            <div className="font-sans font-semibold text-[9.5px] tracking-[0.1em] uppercase text-foreground border-b border-hairline pb-1 mb-[9px]">
              Experience
            </div>
            <div className="font-semibold text-xs text-foreground mb-0.5">
              Senior Data Analyst · Wayfair
            </div>
            <div className="text-[10px] text-muted-foreground mb-2.5">
              Rebuilt the marketplace attribution pipeline, cutting nightly runtime from 4h to 38m.
            </div>
            <div className="font-semibold text-xs text-foreground mb-0.5">Data Analyst · Ramp</div>
            <div className="text-[10px] text-muted-foreground">
              Owned nightly ETL across 6 daily jobs, holding on-time delivery above 98%.
            </div>
          </div>
          <div
            className="absolute bottom-3 left-0 w-[260px] bg-card border border-hairline rounded-[9px] shadow-2xl py-4 pr-4"
            style={{
              background: getEdgeStripeBackground("work_experience", 2),
              backgroundColor: "var(--card)",
              paddingLeft: 20,
            }}
          >
            <div className="font-mono text-[9.5px] tracking-[0.05em] uppercase text-accent-teal mb-[5px]">
              Work experience · used in 2 resumes
            </div>
            <div className="font-semibold text-sm text-foreground">
              Senior Data Analyst · Wayfair
            </div>
            <div className="text-xs text-muted-foreground mt-1">2021 – 2024</div>
          </div>
        </div>
      </div>

      {/* PROBLEM */}
      <div className="bg-panel border-y border-hairline py-18 px-14">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-16 items-start">
          <div>
            <div className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3.5">
              The problem
            </div>
            <h2 className="font-bold text-3xl leading-[1.2] tracking-[-0.01em]">
              Most job seekers already maintain 3–8 near-duplicate resumes
            </h2>
          </div>
          <div className="flex flex-col gap-6">
            {[
              {
                color: "#8C4A6B",
                title: "Fixing a typo means editing every copy",
                body: "And people miss copies. A job title change six months ago is still wrong on the resume you send tomorrow.",
              },
              {
                color: "#2E7D63",
                title: "Tailoring means copy-pasting between docs",
                body: "And re-fixing formatting every time you do it — for content that's 85% identical to the last version.",
              },
              {
                color: "#1D6EBC",
                title: "Writing a strong bullet happens in a blank box",
                body: "The genuinely hard part of a resume gets no help at all — until now.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="w-[3px] rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <div className="font-semibold text-[15px] mb-1">{item.title}</div>
                  <div className="text-sm text-muted-foreground leading-[1.55]">{item.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how-it-works" className="max-w-[1280px] mx-auto px-14 py-22">
        <div className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3.5 text-center">
          How it works
        </div>
        <h2 className="font-bold text-[32px] text-center tracking-[-0.01em] mb-14">
          Three steps. One loop you keep coming back to.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          <Card className="p-7 gap-4">
            <CardHeader className="p-0">
              <div className="font-mono text-[11px] text-muted-foreground mb-1">01</div>
              <CardTitle className="text-[17px] font-bold">Upload your resume</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col gap-4.5">
              <p className="text-[13.5px] text-muted-foreground leading-[1.6]">
                Drop a PDF. We parse it into typed blocks — one per job, project, and skill
                group — in under a minute. No blank-page problem.
              </p>
              <div className="bg-panel rounded-lg px-3.5 py-3 flex flex-col gap-1.5">
                <div className="w-[70%] h-1.5 bg-hairline rounded-full" />
                <div className="w-[50%] h-1.5 bg-hairline rounded-full" />
                <div className="w-[60%] h-1.5 bg-hairline rounded-full" />
              </div>
            </CardContent>
          </Card>
          <Card className="p-7 gap-4">
            <CardHeader className="p-0">
              <div className="font-mono text-[11px] text-muted-foreground mb-1">02</div>
              <CardTitle className="text-[17px] font-bold">Assemble targeted resumes</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col gap-4.5">
              <p className="text-[13.5px] text-muted-foreground leading-[1.6]">
                Build a resume for each role type from blocks you already wrote. Duplicate a
                resume and swap a few blocks — most second resumes are a fork, not a rebuild.
              </p>
              <div
                className="border border-hairline rounded-md py-2.5 pr-3"
                style={{
                  background: getEdgeStripeBackground("work_experience", 2),
                  backgroundColor: "var(--card)",
                  paddingLeft: 18,
                }}
              >
                <div className="font-mono text-[9px] text-accent-teal uppercase">
                  Used in 2 resumes
                </div>
                <div className="font-semibold text-[12.5px] text-foreground mt-0.5">
                  Senior Data Analyst · Wayfair
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-7 gap-4">
            <CardHeader className="p-0">
              <div className="font-mono text-[11px] text-muted-foreground mb-1">03</div>
              <CardTitle className="text-[17px] font-bold">Sharpen with AI, on your terms</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col gap-4.5" id="ai-generation">
              <p className="text-[13.5px] text-muted-foreground leading-[1.6]">
                Improve or write a block&apos;s text with full context of what it already
                says. Review side by side. Nothing lands until you accept it.
              </p>
              <div className="bg-proof-bg rounded-lg px-3 py-2.5">
                <div className="font-mono text-[9px] text-proof-fg uppercase mb-1">
                  Proof — not yours yet
                </div>
                <div className="text-[11.5px] text-foreground leading-[1.5]">
                  Rebuilt the pipeline, cutting nightly runtime from 4h to 38m.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* REUSE MECHANIC */}
      <div className="bg-foreground py-22 px-14">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3.5">
              Edit once
            </div>
            <h2 className="font-bold text-3xl leading-[1.25] tracking-[-0.01em] text-primary-foreground mb-4.5">
              A block can live on more than one resume. So reuse gets a mark, not a
              sentence.
            </h2>
            <p className="text-[14.5px] leading-[1.65] text-primary-foreground/60 mb-5">
              Every block card shows exactly how many resumes it&apos;s on — in the library,
              on the canvas, in the editor. One rule is one resume, two means two, three or
              more is three and the count. Before you save an edit, you see who it reaches.
            </p>
            <p className="text-[14.5px] leading-[1.65] text-primary-foreground/60">
              Want a one-off tweak instead? &quot;Edit only on this resume&quot; forks the
              block into an independent copy, with one click.
            </p>
          </div>
          <div className="flex flex-col gap-3.5">
            {[
              { title: "Support Engineer · Zendesk", count: 1 },
              { title: "Data Analyst · Ramp", count: 2 },
              { title: "Senior Data Analyst · Wayfair", count: 3 },
            ].map((item) => (
              <div
                key={item.title}
                className="border rounded-[9px] py-3.5 pr-4"
                style={{
                  background: getEdgeStripeBackground("work_experience", item.count),
                  backgroundColor: "#1A2029",
                  borderColor: "#2E3742",
                  paddingLeft: item.count === 1 ? 16 : item.count === 2 ? 20 : 26,
                }}
              >
                <div className="font-semibold text-sm text-primary-foreground">{item.title}</div>
                <div className="font-mono text-[9.5px] tracking-[0.05em] uppercase text-accent-teal mt-1">
                  Used in {item.count} resume{item.count > 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="py-24 px-14 text-center">
        <h2 className="font-bold text-[34px] tracking-[-0.01em] mb-4">
          Stop maintaining duplicates by hand
        </h2>
        <p className="text-[15.5px] text-muted-foreground mb-[30px]">
          Upload your existing resume and see it as blocks in under a minute.
        </p>
        <Link
          href={signedIn ? "/dashboard" : "/sign-up"}
          className="inline-block font-sans text-[15px] font-semibold text-primary-foreground bg-foreground rounded-lg px-[26px] py-3.5 hover:opacity-90"
        >
          Upload your resume
        </Link>
      </div>

      {/* FOOTER */}
      <div className="border-t border-hairline py-7 px-14 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-foreground rounded" />
          <span className="font-bold text-[13px]">Blocks</span>
        </div>
        <span className="text-xs text-muted-foreground">
          One library. As many resumes as you need.
        </span>
      </div>
    </div>
  );
}
