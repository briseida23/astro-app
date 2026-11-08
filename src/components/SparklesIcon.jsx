// Two golden four-pointed stars, the same shape and colour as the star in the logo.
// Marks the "Support the project" links.
export function SparklesIcon({ className = 'h-4 w-4' }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="#FBBC04">
      <path d="M10 3C10.6 7.4 11.6 8.4 16 9C11.6 9.6 10.6 10.6 10 15C9.4 10.6 8.4 9.6 4 9C8.4 8.4 9.4 7.4 10 3Z" />
      <path d="M18 13C18.3 15.2 18.8 15.7 21 16C18.8 16.3 18.3 16.8 18 19C17.7 16.8 17.2 16.3 15 16C17.2 15.7 17.7 15.2 18 13Z" />
    </svg>
  );
}
