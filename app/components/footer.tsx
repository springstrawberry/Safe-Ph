export function Footer() {
  return (
    <footer className="w-full py-2 px-4 text-xs text-muted-foreground/70 border-t">
      <div className="container mx-auto flex justify-between items-center">
        <span>Yours, Truly Denise Valerie</span>
        <span>
          Powered by{" "}
          <a 
            href="https://earthquake.usgs.gov/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            USGS
          </a>
        </span>
      </div>
    </footer>
  );
}

