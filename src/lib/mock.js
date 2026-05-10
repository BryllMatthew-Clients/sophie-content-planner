// Mock Claude responses for free end-to-end testing (MOCK=true).
// Each function returns a fake Anthropic messages response object.

function makeResponse(text) {
  return { content: [{ type: 'text', text }] };
}

export function mockResearch() {
  return makeResponse(`## Topic 1: S-Corp Reasonable Compensation and IRS Scrutiny in 2026
**Pillar:** Advanced Planning
**Audience:** Entrepreneurs and 6–7 figure founders
**Why trending:** The IRS has increased S-Corp audits 40% in 2025–2026, targeting owners paying themselves below-market salaries. New IRS guidance clarifies what "reasonable" means by industry.
**Pain point question:** "How do I know if my S-Corp salary is too low before the IRS flags me?"
**Misinformation to bust:** Social media says "pay yourself $1 to avoid payroll tax" — this is an audit magnet, not a strategy.
**Wealth-building angle:** Every dollar of optimized S-Corp salary freed from over-taxation becomes capital for index funds or real estate.
**Content angles:**
- Angle 1: "The $1 Salary Myth — Why It Will Cost You More Than You Save"
- Angle 2: "How to Calculate Your S-Corp Reasonable Compensation (IRS-Approved Method)"
- Angle 3: "S-Corp vs. LLC: Which Structure Actually Saves You More in 2026?"

## Topic 2: Cost Segregation for Short-Term Rental Operators
**Pillar:** Real Estate
**Audience:** STR operators and real estate investors
**Why trending:** Bonus depreciation phased to 40% in 2026, making cost seg studies more urgent before further phase-downs. STR investors are racing to accelerate deductions.
**Pain point question:** "Can I use cost segregation on my Airbnb to offset my W2 income?"
**Misinformation to bust:** Many believe cost seg only works for large commercial properties — in reality, a $400K STR can generate $80K+ in first-year deductions.
**Wealth-building angle:** $80K in deductions at a 37% rate = $29,600 cash back that can fund the next property down payment.
**Content angles:**
- Angle 1: "Your Airbnb Could Be Hiding $80K in Tax Deductions You're Not Taking"
- Angle 2: "Cost Segregation + STR: The Combo That Changes Everything for Real Estate Investors"
- Angle 3: "Bonus Depreciation Is Going Away — Here's How to Lock In Deductions Now"

## Topic 3: Solo 401(k) Contribution Limits and Mega Backdoor Roth
**Pillar:** Advanced Planning
**Audience:** Self-employed founders and high-income W2 earners
**Why trending:** 2026 Solo 401(k) limits hit $70,000 total. The Mega Backdoor Roth strategy is gaining traction as a legal workaround for income-restricted Roth contributions.
**Pain point question:** "Can I still do a backdoor Roth if I make over $300K?"
**Misinformation to bust:** Most believe Roth IRAs are off-limits above the income threshold — the mega backdoor Roth route is widely unknown.
**Wealth-building angle:** $70K/year in a Solo 401(k) compounding tax-free for 20 years dwarfs a standard brokerage account by $400K+.
**Content angles:**
- Angle 1: "You Make Too Much for a Roth IRA — Here's the Legal Workaround"
- Angle 2: "Solo 401(k) in 2026: The $70,000 Retirement Strategy Most Founders Ignore"
- Angle 3: "Mega Backdoor Roth Explained in Plain English (With Numbers)"

## Topic 4: Real Estate Professional Status for Medical Professionals
**Pillar:** Real Estate
**Audience:** Physicians, dentists, and specialists
**Why trending:** More physicians are acquiring rental properties post-COVID; few know REPS can unlock unlimited passive loss deductions against W2 income.
**Pain point question:** "Can a doctor qualify as a real estate professional for tax purposes?"
**Misinformation to bust:** Physicians assume REPS is impossible due to their hours — a spouse qualifying can cover the household.
**Wealth-building angle:** A physician household offsetting $200K in rental losses against W2 income saves $74K in taxes — enough to fund two more properties.
**Content angles:**
- Angle 1: "The Doctor's Secret: How Physicians Use Real Estate to Zero Out Their Tax Bill"
- Angle 2: "Does Your Spouse Qualify for Real Estate Professional Status? The Overlooked Loophole"
- Angle 3: "REPS vs. STR Material Participation: Which Tax Status Is Right for You?"

## Topic 5: Opportunity Zone Investments Before 2026 Deadline
**Pillar:** Wealth Vision
**Audience:** High-income earners with large capital gains events
**Why trending:** The December 31, 2026 deadline for the original Opportunity Zone basis step-up benefit is creating urgency. Investors with 2024–2025 gain events are running out of time.
**Pain point question:** "Is it too late to invest in an Opportunity Zone and still get the tax benefit?"
**Misinformation to bust:** Many think OZ benefits disappeared — the capital gains exclusion on OZ appreciation is still fully intact with no expiry.
**Wealth-building angle:** Deferring a $500K capital gain into an OZ fund eliminates immediate tax and grows the deferred gain tax-free if held 10 years.
**Content angles:**
- Angle 1: "The 2026 Opportunity Zone Deadline Is Real — Here's What You Still Have Time To Do"
- Angle 2: "Sold Your Business? Here's How to Legally Defer (and Eliminate) the Capital Gains Tax"
- Angle 3: "Opportunity Zones in 2026: Still Worth It or Overhyped?"`);
}

export function mockLinkedIn(index) {
  const posts = [
    `Medical professionals are overpaying the IRS by $50,000+ every year.

Not because the code is unfair.

Because no one showed them the S-Corp structure.

Here's what changes when you set it up correctly:

→ You split your income between salary and distributions
→ Only the salary portion is subject to self-employment tax
→ Distributions flow through at the lower rate
→ The delta becomes investable capital

The "flip" most people miss:

That $18,000 in annual SE tax savings isn't just savings.

At 7% compounded over 20 years, it becomes $700,000 in investment assets.

This is the difference between a high-income earner and a wealth builder.

Are you structured as an S-Corp, or are you still leaving six figures on the table?

**VISUAL CONCEPT**
Format: B
Background: Left #808080 overlay / Right #0A1628
Headline text: "LLC vs. S-Corp" — white, large, split header
Subtext: Left: "Pay SE tax on everything" / Right: "Pay SE tax on salary only" — white, medium
Visual element: Gold dividing line center
Sophie headshot: yes, bottom-right
Logo: yes, bottom-left, full white`,

    `Every Airbnb owner I meet says the same thing:

"I didn't know I could do that."

They're talking about cost segregation.

Here's the short version:

→ Your STR property isn't just a building — it's a bundle of depreciable assets
→ Cost seg breaks that bundle apart: appliances, flooring, fixtures, landscaping
→ Those components depreciate in 5–15 years instead of 27.5
→ Bonus depreciation accelerates that into year ONE

On a $500K short-term rental, you can often generate $70K–$100K in first-year deductions.

Against W2 income. Against active income. Against whatever you have.

The wealth angle:

$100K deduction at a 35% rate = $35,000 in your pocket, not the IRS's.

$35,000 deployed into your next property = the portfolio grows itself.

Have you had a cost segregation study done on your rental? Drop a comment — I'll tell you if it makes sense for your situation.

**VISUAL CONCEPT**
Format: D
Background: #0A1628
Headline text: "$100K" — #C9A84C, oversized/hero
Subtext: "In year-one deductions from a $500K STR. Most owners never claim it." — white, medium
Sophie headshot: no
Logo: yes, bottom-left, full white`,

    `The Solo 401(k) is the most under-used retirement account in America.

Not for employees. For owners.

Here's what it allows in 2026:

→ $23,500 as the employee elective deferral
→ Up to 25% of net self-employment income as employer contribution
→ Total cap: $70,000 per year
→ Catch-up contributions if you're 50+: add $7,500

And if your plan allows after-tax contributions?

You can execute the Mega Backdoor Roth — rolling after-tax dollars into Roth status, sidestepping income limits entirely.

The wealth flip:

$70K/year compounding in a tax-advantaged account for 20 years at 7% = $2.9M.

The same $70K in a taxable brokerage? $2.1M after taxes.

The difference is $800,000 — from a structure, not a stock pick.

Are you maxing your Solo 401(k) or leaving $800K on the table?

**VISUAL CONCEPT**
Format: C
Background: #0A1628
Headline text: "Solo 401(k) Contribution Breakdown 2026" — white, medium
Subtext: Gold numbered list: 1. Employee deferral: $23,500 / 2. Employer match: up to 25% / 3. Total cap: $70,000
Sophie headshot: no
Logo: yes, bottom-left, full white`,

    `Physicians own real estate. Most are doing it wrong from a tax perspective.

Not because they don't work hard.

Because they haven't heard of Real Estate Professional Status.

Here's why it matters:

→ Rental losses are normally "passive" — they can only offset passive income
→ REPS reclassifies your real estate activity as active
→ Active losses can offset W2 income dollar-for-dollar
→ A $150K rental loss becomes a $150K deduction against your physician salary

The qualification test:

750+ hours in real estate activities per year, AND more hours in real estate than any other profession.

Difficult for a full-time physician. Not impossible for a physician's spouse.

A spouse who qualifies? The entire household gets the benefit.

The wealth angle:

$150K in deductions at a 37% bracket = $55,500 in tax savings per year.

Invested at 7% for 10 years = $768,000 in additional net worth.

Are you or your spouse tracking real estate hours? It's the first step.

**VISUAL CONCEPT**
Format: A
Background: #1B4332
Headline text: "Real Estate Professional Status Can Zero Out a Physician's Tax Bill" — white, large
Subtext: "750 hours. That's the threshold that changes everything." — #C9A84C, medium
Sophie headshot: yes, bottom-right
Logo: yes, bottom-left, full white`,

    `The 2026 Opportunity Zone deadline isn't a rumor.

If you had a major capital gains event in the last 18 months, the clock is running.

Here's what Opportunity Zones still offer:

→ Defer capital gains tax by reinvesting into a Qualified OZ Fund
→ The 2026 deadline applies to the original basis step-up benefit
→ The capital gains exclusion on OZ appreciation is still 100% intact — no expiry
→ Hold for 10 years, and all appreciation inside the fund is tax-free

On a $500K gain reinvested:

Immediate deferral: $185,000 in taxes not paid this year.
10-year appreciation exclusion: potentially $300K–$500K in gains you never pay tax on.

The wealth flip:

This isn't a loophole. It's the tax code rewarding long-term capital deployment.

Did you sell a business, property, or significant stock position in 2024–2025? Reply "OZ" and I'll walk you through whether this still makes sense for your situation.

**VISUAL CONCEPT**
Format: B
Background: Left #808080 overlay / Right #0A1628
Headline text: "Taxable Sale vs. OZ Reinvestment" — white, large, split header
Subtext: Left: "Pay $185K now, invest the rest" / Right: "Invest full $500K, defer the tax" — white, medium
Visual element: Gold dividing line
Sophie headshot: yes, bottom-right
Logo: yes, bottom-left, full white`,
  ];
  return makeResponse(posts[index] ?? posts[0]);
}

export function mockFacebook(index) {
  const posts = [
    `Last Tuesday I sat across from a physician who had been running a thriving practice for fourteen years. He handed me his return, and the first thing I noticed was the entity structure — still a sole proprietorship. No S-Corp election. No distribution strategy. Just a single line: $680,000 in net self-employment income, and the full SE tax applied to every dollar of it.

I asked him when he'd last reviewed his entity setup. He said his original accountant set it up in 2010 and he'd never thought to question it.

Here's what I found in that return: $41,000 in unnecessary self-employment tax, paid every year, because the structure had never been updated to match his income level.

The fix isn't complicated. An S-Corp election splits income between a reasonable salary and distributions. Payroll taxes apply only to the salary portion. The distribution flows through at a significantly lower rate. For someone earning $680,000, that difference is real money — money that currently goes to the IRS before he ever sees it.

What I want people to understand is that the savings aren't the point. The savings are the vehicle.

$41,000 per year. Invested at a 7% average return for the next fifteen years. That's not a tax refund — that's $1.1 million in additional net worth built from a structure change he could have made a decade ago.

The tax code isn't the enemy. Inertia is.

If you're a business owner or medical professional who hasn't reviewed your entity structure in the last three years, this is your sign. The rules haven't changed. Your income has. Your structure should too.

Share this with a business owner in your life who might be in the same boat. The conversation it starts could be the most valuable one they have this year.

---
*This content is for educational purposes only and does not constitute specific legal, tax, or financial advice. Consult a qualified tax professional for guidance tailored to your situation.*`,

    `I remember the first time a client showed me their short-term rental portfolio and told me they hadn't done a cost segregation study. They had four Airbnb properties. They'd been doing their own returns for three years.

I pulled up their most recent filing and started running numbers in my head.

Four properties. Average value around $450,000 each. No accelerated depreciation. No cost seg. Just straight-line over 27.5 years, the way most people do it when they don't know there's another way.

We spent the next two hours going through what a cost segregation analysis would actually reveal. When you break a rental property into its components — appliances, flooring, fixtures, landscaping, personal property — those pieces depreciate in five to fifteen years, not twenty-seven. And with bonus depreciation, you can pull much of that forward into year one.

Across four properties, the number we landed on was $280,000 in available first-year deductions they had never claimed.

That's not theoretical. That's real money that had been left sitting in the return year after year.

The part that still gets me is what $280,000 in deductions actually means in practice. At their effective rate, that's roughly $98,000 in taxes not paid — money that stays in their hands instead of going to the IRS.

What do you do with $98,000? You do what every serious real estate investor does. You put it into the next property. Or you pay down debt on an existing one. Or you park it somewhere it compounds quietly over time.

This is why I don't talk about tax savings as an end goal. Savings are the starting capital. What you build with them is the real story.

If you own short-term rentals and haven't had a cost segregation study done, share this post with your accountant and ask them one question: "Are we leaving depreciation on the table?"

---
*This content is for educational purposes only and does not constitute specific legal, tax, or financial advice. Consult a qualified tax professional for guidance tailored to your situation.*`,
  ];
  return makeResponse(posts[index] ?? posts[0]);
}

export function mockYoutube() {
  return makeResponse(`## Video 1: How to Pay Yourself From an S-Corp (Without Triggering an IRS Audit)

**Alternative Titles:**
- S-Corp Salary: The IRS Reasonable Compensation Rule Explained
- The Right Way to Pay Yourself From Your S-Corp in 2026

**Target Keyword:** S-Corp reasonable compensation 2026
**Audience Segment:** Founder
**Recommended Length:** 12–16 minutes

**Hook Script (0:00–0:30):**
If you own an S-Corp and you're paying yourself a salary you picked from thin air, there's a good chance the IRS already has a flag on your return. In 2025 and 2026, the agency increased S-Corp audits by over 40%, and the number one trigger is a salary that doesn't pass the "reasonable compensation" test. In the next 15 minutes, I'm going to walk you through exactly how the IRS defines reasonable, how to calculate a defensible number, and how to structure your S-Corp so you're saving the maximum amount in payroll taxes — legally, permanently, and without ever worrying about an audit letter.

**Outline:**
1. Why S-Corp Salary Is the Most Audited Line Item for Small Business Owners — what reasonable compensation means under IRC Section 3121; why $1 salaries are a myth that costs more than it saves
2. How the IRS Actually Determines Reasonable Compensation — the three methods: comparable salary, cost of service, and percentage of revenue; which industries get the most scrutiny
3. Sophie's Framework for Setting a Defensible Salary — step-by-step walkthrough; documentation you need to keep on file
4. Real Client Example: How a $320K Business Owner Saved $19,400 Per Year — anonymized scenario with before/after numbers; the distribution split that made it work
5. CTA/Outro — Book a discovery call to review your current S-Corp structure; what you'll leave the call knowing about your own reasonable compensation number

**Thumbnail Concept:** Bold white text "Is Your S-Corp Salary an Audit Red Flag?" on navy background. Sophie positioned left, slightly off-center, in professional blazer. Gold accent bar across the bottom with "IRS Increased Audits 40%."
**Related Videos to Link:** Cost segregation for business owners, Solo 401(k) strategy for S-Corp owners, S-Corp vs. LLC comparison

---

## Video 2: Cost Segregation Explained — How Real Estate Investors Create $80K in Year-One Deductions

**Alternative Titles:**
- The Tax Strategy That Turns Your Rental Into a Deduction Machine
- Cost Segregation Study: Is It Worth It for Small Real Estate Investors?

**Target Keyword:** cost segregation study rental property
**Audience Segment:** Real Estate
**Recommended Length:** 14–18 minutes

**Hook Script (0:00–0:30):**
Most real estate investors are depreciating their properties over 27.5 years because that's what the tax code says to do — and they're leaving tens of thousands of dollars on the table every single year because of it. What they don't know is that your rental property isn't one asset. It's dozens. And many of those components — the appliances, the flooring, the landscaping, the fixtures — depreciate in 5 to 15 years. When you accelerate that with cost segregation, a $500,000 short-term rental can generate $80,000 or more in year-one deductions. I'm going to show you exactly how it works and whether it makes financial sense for your portfolio.

**Outline:**
1. What Straight-Line Depreciation Is Costing You — the 27.5-year default vs. component depreciation; how bonus depreciation works in 2026 at 40%
2. What Cost Segregation Actually Is — the engineering study process; what components get reclassified; who qualifies
3. The Math: Running a $450K STR Through a Cost Seg Analysis — real numbers; estimated deduction range; effective tax rate impact
4. When Cost Seg Doesn't Make Sense — minimum property values; passive loss limitation rules; when to wait
5. CTA/Outro — Discovery call to evaluate whether your portfolio is a candidate; what they'll leave knowing

**Thumbnail Concept:** Large gold "$80,000" center-dominant on navy background. White subtext: "Year-One Deductions From One Rental." No headshot — let the number carry it. Paramount Tax logo bottom-left.
**Related Videos to Link:** Real estate professional status explained, STR tax rules 2026, Bonus depreciation phase-down strategy`);
}
