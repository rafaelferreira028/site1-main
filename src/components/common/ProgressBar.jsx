function ProgressBar({ width, opacity }) {
    return (
        <div
            id="global-progress-bar"
            style={{
                width: `${width}%`,
                opacity: opacity
            }}
        />
    );
}

window.ProgressBar = ProgressBar;
