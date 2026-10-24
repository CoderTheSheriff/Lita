# Contributing to Lita

Thank you for helping build and improve Lita! We welcome development contributions across our language specification, font assets, and core rendering systems to help make Lita cleaner and easier to use.

## Contribution Scopes

### Core Rendering
If you encounter parsing pipelines bugs or environment-specific display issues, please open a GitHub issue. To help us debug quickly, include your raw input strings, OS/host application versions, and a screenshot of the malformed output.

### Font Assets
We welcome updates to glyph designs, kerning metrics, or character coverage. When modifying assets, please ensure changes maintain consistency with the existing design system and update any relevant font metadata or compilation build scripts.

* **Asset Synchronization:** When updating a character, ensure the raw vector file in `Characters/[word].svg` and the master font files (such as `.sfd` and `.ttf`) in the main `Lita/` folder are updated together so they do not fall out of sync.

### Language Specification
If you have ideas to simplify syntax or modify grammar rules, please open an issue or discussion thread first. We look for a clear technical rationale, comparative syntax examples, and a brief assessment of how the change impacts backward compatibility.

* **Immutable Core:** The 50 core words are frozen to preserve the language's foundation. Any proposal that alters, removes, or adds to these 50 words will be closed. Please strictly cross-reference your proposal with the vocabulary listed in the main `README.md` before submitting an issue or PR. Though you can still attempt to do a small meaningful change, and could be changed.

## Development Workflow

1. Fork the repository and clone it to your local environment.
2. Create a feature branch off `main` using a descriptive prefix (like `fix/` or `spec/`).
3. Implement your changes locally and verify that everything renders and behaves as intended.
4. Submit a Pull Request containing a clear technical summary of your modifications.

## Testing and Verification

All verification is done manually using the local preview environment:

* **Font & SVG Testing:** If you modify character vectors (`Characters/[word].svg`) or font files in the main `Lita/` folder, regenerate the `.ttf` and test the outputs visually.
* **HTML Preview Verification:** To test rendering, navigate to the `Preview/` directory and open `index.html` in your web browser or IDE. 
  * Type into the input box to verify the specific characters you changed render correctly at a large scale.
  * Scroll down to the sample paragraph to verify the Lita text reads correctly alongside the Romanized and English comparison versions.
* **Keyboard Validation:** If editing the keyboard layouts, ensure changes are correctly synced across the `Keyman/source/` and `Keyman/build/` directories, and compile them via Keyman Developer to verify mapping accuracy.
