import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDepthScroll } from '../hooks/useDepthScroll'
import './Landing.css'
import './LandingMotion.css'

type DoodleKind = 'popcorn' | 'ticket' | 'reel' | 'camera' | 'seat' | 'projector'

type Poster = {
	title: string
	note: string
	kind: DoodleKind
}

const posters: Poster[] = [
	{ title: 'Butter & Light', note: 'a little salty, a little sweet', kind: 'popcorn' },
	{ title: 'One More Scene', note: 'admit one, stay awhile', kind: 'ticket' },
	{ title: 'The Last Reel', note: 'stories go around', kind: 'reel' },
	{ title: 'Close-Up Club', note: 'made for the big screen', kind: 'camera' },
	{ title: 'Soft Landing', note: 'your seat is waiting', kind: 'seat' },
	{ title: 'After the Credits', note: 'one more for the road', kind: 'projector' },
]

function PosterDoodle({ kind }: { kind: DoodleKind }) {
	const lineProps = {
		fill: 'none',
		stroke: 'currentColor',
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		strokeWidth: 3,
	}

	switch (kind) {
		case 'popcorn':
			return <><path d="M45 62h91l-12 65H57z" {...lineProps} /><path d="M49 62c-8-20 9-32 21-20 1-20 26-24 32-5 12-18 34-8 29 11 19 4 16 26 0 27M61 78l8 40m21-39-1 41m25-40-7 39" {...lineProps} /><path d="M70 49c7 4 11 9 12 15m29-23c-8 4-12 11-12 19" {...lineProps} /></>
		case 'ticket':
			return <><path d="M37 48q0-7 8-7h91q8 0 8 7v19a14 14 0 0 0 0 27v17q0 8-8 8H45q-8 0-8-8V94a14 14 0 0 0 0-27z" {...lineProps} /><path d="M92 45v13m0 11v11m0 11v11m0 11v8M58 63h19m-19 19h14m-14 20h18" {...lineProps} /><path d="m107 81 8 8 15-18" {...lineProps} /></>
		case 'reel':
			return <><circle cx="91" cy="83" r="48" {...lineProps} /><circle cx="91" cy="83" r="12" {...lineProps} /><circle cx="91" cy="53" r="10" {...lineProps} /><circle cx="117" cy="98" r="10" {...lineProps} /><circle cx="65" cy="98" r="10" {...lineProps} /><path d="M126 48c12 1 20 9 22 21m-1 30c-2 11-9 19-20 22" {...lineProps} /></>
		case 'camera':
			return <><path d="M39 64h27l10-15h34l10 15h20q8 0 8 8v48q0 8-8 8H39q-8 0-8-8V72q0-8 8-8z" {...lineProps} /><circle cx="92" cy="94" r="23" {...lineProps} /><circle cx="92" cy="94" r="13" {...lineProps} /><path d="M129 77h8m-88 0h8" {...lineProps} /></>
		case 'seat':
			return <><path d="M57 67V51q0-9 9-9h47q9 0 9 9v30q0 8-9 8H76q-19 0-19-22zM49 89h75q9 0 9 9v15q0 9-9 9H49q-9 0-9-9V98q0-9 9-9zm7 34-7 13m68-13 8 13" {...lineProps} /><path d="M70 59h42M53 102h67" {...lineProps} /></>
		case 'projector':
			return <><path d="M44 70h94q9 0 9 9v39q0 8-9 8H44q-9 0-9-8V79q0-9 9-9z" {...lineProps} /><circle cx="69" cy="93" r="13" {...lineProps} /><circle cx="111" cy="93" r="13" {...lineProps} /><path d="M60 70 53 50h62l-8 20m16-24h20m-10-10v20M64 126l-8 13m59-13 8 13" {...lineProps} /><path d="M153 87q22 6 0 12m0 10q35 10 0 20" {...lineProps} /></>
	}
}

function PosterCard({ poster, index }: { poster: Poster; index: number }) {
	return (
		<article className={`poster-card poster-card-${index % 3}`}>
			<span className="poster-index">NO. {String(index + 1).padStart(2, '0')}</span>
			<svg className="poster-art" viewBox="0 0 180 160" aria-hidden="true">
				<PosterDoodle kind={poster.kind} />
			</svg>
			<p className="poster-title">{poster.title}</p>
			<p className="poster-note">{poster.note}</p>
		</article>
	)
}

function PosterRow({ row, reverse = false }: { row: number; reverse?: boolean }) {
	const rowPosters = [...posters.slice(row, row + 4), ...posters.slice(0, Math.max(0, row + 4 - posters.length))]

	return (
		<div className={`poster-row ${reverse ? 'poster-row-reverse' : ''}`}>
			<div className="poster-track" aria-hidden="true">
				{[0, 1].map((copy) => (
					<div className="poster-group" key={copy}>
						{rowPosters.map((poster, index) => (
							<PosterCard key={`${copy}-${poster.title}`} poster={poster} index={index + row} />
						))}
					</div>
				))}
			</div>
		</div>
	)
}

function Landing() {
	const pageRef = useRef<HTMLDivElement>(null)
	useDepthScroll(pageRef)

	return (
		<div className="landing-page" ref={pageRef}>
			<header className="landing-header">
				<Link className="wordmark" to="/" aria-label="Goodshow home">
					<svg viewBox="0 0 42 42" aria-hidden="true">
						<path d="M8 13q1-5 6-5h15q5 0 5 5v16q0 5-5 5H14q-6 0-6-6zM14 8l4 7m7-7-4 7M8 19l9 4-9 4m26-8-9 4 9 4M17 23q4-4 8 0m-8 6q4 4 8 0" />
					</svg>
					<span>goodshow</span>
				</Link>
				<a className="about-link" href="#about">About <span aria-hidden="true">↗</span></a>
			</header>

			<main>
				<section className="landing-hero" aria-labelledby="landing-title">
					<p className="eyebrow"><span className="eyebrow-star" aria-hidden="true">✳</span> YOUR NEIGHBOURHOOD PICTURE HOUSE</p>
					<h1 id="landing-title">A little <span>movie</span><br />magic, this way.</h1>
					<p className="hero-copy">Good stories. Comfy seats. Popcorn for the plot.<br className="desktop-break" /> Your next favourite night out starts here.</p>
					<Link className="enter-button" to="/lobby">
						<span>Enter the theatre</span>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
					</Link>
					<span className="hero-scribble hero-scribble-left" aria-hidden="true">✳</span>
					<span className="hero-scribble hero-scribble-right" aria-hidden="true">✳</span>
				</section>

				<section className="poster-marquee" aria-label="Doodles from the theatre">
					<div className="marquee-label"><span>little things we love</span><span className="marquee-rule" /></div>
					<PosterRow row={0} />
					<PosterRow row={1} reverse />
					<PosterRow row={2} />
				</section>
			</main>

			<footer className="landing-footer" id="about">
				<p>Made for nights worth remembering <span aria-hidden="true">✳</span></p>
				<small>Infinite scroll inspired by a CSS technique from @nonzeroexitcode.</small>
			</footer>
		</div>
	)
}

export default Landing
