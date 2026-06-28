import { Component, input } from "@angular/core";

@Component({
  selector: "ecmp-folder-explorer-page",
  standalone: true,
  template: `
    <main class="shell">
      <header class="toolbar">
        <h1>Folder Explorer</h1>
        <nav aria-label="Folder explorer actions">
          <button type="button">New folder</button>
          <button type="button">New content</button>
          <button type="button">Publish</button>
          <button type="button">Unpublish</button>
        </nav>
      </header>

      <section class="workspace" aria-label="Folder explorer workspace">
        <aside>Folder tree placeholder</aside>
        <article>
          <h2>Selected folder</h2>
          <p>{{ folderId() ?? "FLD-root" }}</p>
        </article>
      </section>
    </main>
  `,
  styles: [
    `
      .shell {
        min-height: 100vh;
      }

      .toolbar {
        align-items: center;
        background: #ffffff;
        border-bottom: 1px solid #d7dde3;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        padding: 1rem 1.5rem;
      }

      nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      button {
        background: #1c5d99;
        border: 0;
        color: #ffffff;
        cursor: pointer;
        padding: 0.5rem 0.75rem;
      }

      .workspace {
        display: grid;
        gap: 1rem;
        grid-template-columns: minmax(12rem, 18rem) 1fr;
        padding: 1rem;
      }

      aside,
      article {
        background: #ffffff;
        border: 1px solid #d7dde3;
        padding: 1rem;
      }
    `
  ]
})
export class FolderExplorerPageComponent {
  readonly folderId = input<string>();
}
