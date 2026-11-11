---
version: 1
slug: "relationship-graph-frontend"
primary_target: "relationship-graph/frontend"
related_targets: []
---

# Whole-app redesign

Scope: every page of the frontend. Mode: Operate. Audience: friends in a Thai VRChat group who each have an account and help keep the data current. Task they arrive with: find one person, understand their relationships, add or correct one. Reported pain: unclear page purposes, small Thai text, a graph they cannot read, a complex data-management page. Must keep all existing functionality, roles, and the CLAUDE.md graph rules.

## Direction contract

THESIS: A warm, plain-spoken app where a person's relationships read as Thai sentences, and the one bright colour is always something you can press. Refuses the dark admin-dashboard shell with a sidebar, stat tiles and icon-only table actions.

OWN-WORLD: Warm tinted ground with white cards at large radii; warm dark equivalent for dark mode. One saturated orange-red reserved for pressable things and current selection. One humanist Thai and Latin face at comfortable sizes, generous line height. Relationship colours appear only as dots and graph lines, never as text colour. Soft spring on press.

STORY: Visitors learn what each page is for from a plain sentence at its top, find a person from the front-door search, read their relationships as sentences split into now and ended, and add or correct one in place.

FIRST VIEWPORT: Desktop top bar with logo, four labelled destinations, theme and account. Below it a greeting asking who they want to know about, and a large search field as the single primary action. Results appear directly under it. With no query, friendly lists of the most connected and newest people, a plain sentence of totals, and the relationship types. On phones the same column with a persistent labelled bottom bar.

FORM: Warm consumer app surface, challenger chosen by the user. seed:9ee3ab781ad274fd. Signature move: the relationship sentence, identical on home, profile and graph panel, with the same words printed on the graph's lines in a person's ring. Motion grammar: soft spring on press, 150 to 250 ms state transitions, no entrance choreography.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions

None blocking.
