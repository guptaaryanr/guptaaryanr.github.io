# Website language audit

**Date:** 17 October 2026  
**Source:** `guptaaryanr/guptaaryanr.github.io`, `main`. Reviewed both homepage modes, Research & Software, Experience, CV, the archived-page redirect and 404, plus all thirteen dynamically opened Explore field notes.

## The recurring problems

**1. Everything becomes a moral.** A failed surrogate turns into a maxim about negative results; engineering becomes a general statement about useful software; a past project ends with a neat lesson. Usually the facts just above the moral are more interesting. The edit either deletes that extra conclusion or puts back the actual cause-and-effect.

**2. Repeated mirrored contrasts.** “Different branch. Same instinct.”, “Ambitious, yes. Certain, no.”, “On paper… In practice…”, and “not X but Y” recur enough to become a recognizable generated rhythm. The edit breaks that rhythm rather than replacing it with different slogans.

**3. Overexplaining the website.** The copy repeatedly explains why older projects are still here, why a publication appears twice, or why Explore and Read coexist. Most of that is clear from the page itself. A navigation label should navigate; a project description should explain the project.

**4. Abstract project pitches.** Phrases such as “gives that kind of regression a place in CI” or “reproducible inverse-wave playground” hide the work behind polished packaging. The new versions say what the code receives, computes, and returns. Scientific scope restrictions stay intact.

**5. Unnecessary apologies about past work.** The older robots and processors don't require a defense every time they appear. They simply belong to an earlier period of your work.

## Selected edits

### Explore, Houston

**Before:** “They look separate on a CV. They did not feel separate while I was doing them.”

**After:** “The job titles make the work look more separate than it was.”

This says the same thing without pretending the contrast is a revelation.

### Explore, the interlude

**Before:** “At some point the things I did because I had to and the things I did because I could not leave them alone started overlapping.”

**After:** “The projects below started with questions I wanted to test for myself.”

The old line could go into almost anyone's portfolio. The new one tells a visitor why these independent projects exist.

### Explore, ThermoBench margin note

**Before:** “A negative result is still useful if it tells you where the idea actually fails.”

**After:** “That failed GNN is why I ended up building ThermoBench.”

The latter is specific enough to be worth keeping.

### Explore, Costgate

**Before:** “Nothing has to crash for a system to get worse. An LLM change can quietly become much more expensive while every normal test still passes. I wanted CI to be allowed to care about that too.”

**After:** “An LLM pipeline can pass all its usual tests while the cost per valid answer keeps climbing. Costgate checks for that in CI.”

Still accessible, but it drops the three-part setup and personification.

### Read, introductory text

**Before:** “I usually end up in the same place. Some physical mess has to become something computable, and the model has to survive enough checks that I can trust it.”

**After:** Direct chronology through embedded systems, simulations, controls, carbon capture R&D, and Imperial.

The “grand unifying theory of myself” sounds imposed in a way the actual career history doesn't.

### Research, trajectory detector

**Before:** “No general-purpose bifurcation guarantee is claimed.”

**After:** “That is a result on two systems, not a general result about every dynamical system.”

Same limitation. Much less like an abstract defending itself.

### Research, GNN/VLE

**Before:** “That failure became the useful part.”

**After:** Specific failure in the pressure surface and its derivatives, with no useful speed advantage.

Let the result stand without adding a moral.

### Field notes

Removed several theatrical little closing reflections about *interfaces*, *learning by building*, and *the trail*. Where needed, replaced them with things you actually worked on: the bench, telemetry and power boards, the processor debugger, or evaluation procedures.

## What I deliberately did not rewrite

- “I have a hard time leaving an interesting problem alone.” The detail following this makes it personal.
- “The map is cleaner than the process was.” An intentional, understated aside suited to the visual theme.
- “I picked engineering physics because I did not want to choose between physics and engineering.” Stronger than a list of generic motivations.
- “I like being outside enough that I have learned not to turn it into another productivity system.” It sounds like an actual person.
- “A model can look good and still be useless.” It is supported by the VLE story immediately below it.
- “I want to be able to rerun my own work six months later.” Specific, practical, and true to the software work.
- The uncertainty and negative findings in the research projects. An honest scope statement isn't the same thing as LLM-style hedging.

## Scope of change

53 exact edits across five files. Read the full before/after text in `language_replacements.json`; it is intentionally explicit rather than hidden inside a large overwrite.

I did not edit the linked research PDFs, the CV PDF, public profiles outside this repository, comments in source code, or text embedded inside existing figure files. The academic work may use formal research prose; this pass is for the website's editorial voice.
