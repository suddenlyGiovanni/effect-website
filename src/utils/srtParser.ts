export interface SubtitleEntry {
	index: number;
	startTime: string;
	endTime: string;
	text: string;
}

export function parseSRT(srtContent: string): SubtitleEntry[] {
	const entries: SubtitleEntry[] = [];
	// Normalize line endings (handle Windows \r\n and Mac \r)
	const normalizedContent = srtContent
		.replace(/\r\n/g, "\n")
		.replace(/\r/g, "\n");
	const blocks = normalizedContent.trim().split(/\n\n+/);

	for (const block of blocks) {
		const lines = block.split("\n");
		if (lines.length < 3) continue;

		const index = parseInt(lines[0], 10);
		const timeLine = lines[1];
		const timeMatch = timeLine.match(
			/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/,
		);

		if (!timeMatch) continue;

		const text = lines.slice(2).join(" ");

		entries.push({
			index,
			startTime: timeMatch[1].replace(",", "."),
			endTime: timeMatch[2].replace(",", "."),
			text,
		});
	}

	return entries;
}

export function formatTimestamp(timestamp: string): string {
	// Convert "00:00:00.000" to "MM:SS" or "H:MM:SS"
	const parts = timestamp.split(":");
	const hours = parseInt(parts[0], 10);
	const minutes = parseInt(parts[1], 10);
	const seconds = Math.floor(parseFloat(parts[2]));

	if (hours > 0) {
		const totalMinutes = hours * 60 + minutes;
		return `${totalMinutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}
	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function groupSubtitlesByParagraph(
	entries: SubtitleEntry[],
	maxGapSeconds: number = 2,
): { startTime: string; text: string }[] {
	if (entries.length === 0) return [];

	const paragraphs: { startTime: string; text: string }[] = [];
	let currentParagraph = {
		startTime: entries[0].startTime,
		texts: [entries[0].text],
	};

	for (let i = 1; i < entries.length; i++) {
		const prevEnd = parseTimestamp(entries[i - 1].endTime);
		const currStart = parseTimestamp(entries[i].startTime);
		const gap = currStart - prevEnd;

		// Start new paragraph if gap is large or text ends with sentence-ending punctuation
		const prevText = entries[i - 1].text;
		const endsWithPunctuation = /[.!?]$/.test(prevText.trim());

		if (gap > maxGapSeconds || (endsWithPunctuation && gap > 0.5)) {
			paragraphs.push({
				startTime: currentParagraph.startTime,
				text: currentParagraph.texts.join(" "),
			});
			currentParagraph = {
				startTime: entries[i].startTime,
				texts: [entries[i].text],
			};
		} else {
			currentParagraph.texts.push(entries[i].text);
		}
	}

	// Add final paragraph
	paragraphs.push({
		startTime: currentParagraph.startTime,
		text: currentParagraph.texts.join(" "),
	});

	return paragraphs;
}

function parseTimestamp(timestamp: string): number {
	const parts = timestamp.split(":");
	const hours = parseInt(parts[0], 10);
	const minutes = parseInt(parts[1], 10);
	const seconds = parseFloat(parts[2]);
	return hours * 3600 + minutes * 60 + seconds;
}
