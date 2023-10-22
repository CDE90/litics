export default function Page() {
    return (
        <div>
            <h1>Page</h1>
            {Array.from({ length: 50 }).map((_, i) => (
                <p key={i}>Hello world</p>
            ))}
        </div>
    );
}
