# Member-state key scanner: multi-declarator resolution

**Date:** 2026-11-28

The first inventory pass reported several simple localStorage key constants as unresolved because they were declared after the first binding in a comma-separated `var`, `let`, or `const` statement (for example `var A='omega_a', B='omega_b'`).

The scanner now splits declaration lists at top-level commas while respecting strings and nested delimiters. It resolves only literal string and static template bindings. Computed expressions, function calls, dynamic template literals, and unknown data flow remain unresolved.

This is still a lexical source audit, not a JavaScript parser or runtime proof. It does not infer actual browser values, successful cloud mirroring, or remote row existence. The regenerated inventory must be reviewed before changing mirror, export, deletion, or restore semantics.
