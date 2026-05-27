import type { RenderableResult } from "./RenderableResult";

export class EmojiResult implements RenderableResult {
	constructor(public emoji: string) {}

	render() {
		return (
			<span key="emoji" className="text-2xl">
				{this.emoji}
			</span>
		);
	}
}
