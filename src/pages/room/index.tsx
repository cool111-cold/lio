import { ReactNode, useEffect, useRef, useState } from "react"
import { PageComponent, Header, Text } from "../../components"
import { PageKey } from "../../helpers"
import Bg from '../../assets/video/4.mp4';
import BgImage from '../../assets/img/10.jpg';
import BgImageFront from '../../assets/img/10-front.png';
import './style.css';

interface Track {
    artistId: number;
    artistName: string;
    artistViewUrl: string;
    artworkUrl30: string;
    artworkUrl60: string;
    artworkUrl100: string;
    collectionCensoredName: string;
    collectionExplicitness: string;
    collectionId: number;
    collectionName: string;
    collectionPrice: number;
    collectionViewUrl: string;
    country: string;
    currency: string;
    discCount: number;
    discNumber: number;
    isStreamable: boolean;
    kind: string;
    previewUrl: string;
    primaryGenreName: string;
    releaseDate: string;
    trackCensoredName: string;
    trackCount: number;
    trackExplicitness: string;
    trackId: number;
    trackName: string;
    trackNumber: number;
    trackPrice: number;
    trackTimeMillis: number;
    trackViewUrl: string;
    wrapperType: string;
}

const getHighResArtwork = (url: string, size = 600) =>
    url.replace(/\d+x\d+bb\.jpg$/, `${size}x${size}bb.jpg`);

const Background = ({children, videoEnded, imageBlurred, onVideoEnded}: {children: ReactNode, videoEnded: boolean, imageBlurred: boolean, onVideoEnded: () => void}) => {
    return (
        <div style={{position: 'relative', width: '100%', height: '90%'}}>
            <video
                src={Bg}
                autoPlay
                muted
                playsInline
                onEnded={onVideoEnded}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'blur(12px)',
                    opacity: videoEnded ? 0 : 1,
                    transition: 'opacity 0.8s ease-in-out',
                }}
            />
            <img
                src={BgImage}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: videoEnded ? 1 : 0,
                    filter: imageBlurred ? 'blur(12px)' : 'blur(0px)',
                    transition: 'opacity 0.8s ease-in-out, filter 2s ease-out',
                }}
            />
            <img
                src={BgImageFront}
                style={{
                    position: 'absolute',
                    zIndex: 102,
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: videoEnded ? 1 : 0,
                    filter: imageBlurred ? 'blur(12px)' : 'blur(0px)',
                    transition: 'opacity 0.8s ease-in-out, filter 2s ease-out',
                    pointerEvents: 'none',
                }}
            />
            {children}
        </div>
    )
}

// const SongCover = ({track, onClick}: {track: Track, onClick: (track: Track) => void}) => {
//     return (
//         <div className="song-cover-wrapper" onClick={() => onClick(track)}>
//             <img className="song-cover" src={getHighResArtwork(track.artworkUrl100)} alt={track.trackName} />
//             <div className="song-cover-title">
//                 <Text size="xs" color="dark">{track.trackName}</Text>
//             </div>
//             <div className="song-cover-subtitle">
//                 <Text size="xs" color="gray">{track.artistName}</Text>
//             </div>
//         </div>
//     )
// }

const SongCover = ({track, isPlaying, progress, onClick}: {track: Track, isPlaying: boolean, progress: number, onClick: (track: Track) => void}) => {
    return (
        <div className="song-cover-wrapper" onClick={() => onClick(track)}>
            <div style={{width: '30vw', height: '20vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', backgroundColor: 'red', borderRadius: 25, overflow: 'hidden'}}>
                <img style={{objectFit: 'cover', width: '100%', height: '100%'}} src={getHighResArtwork(track.artworkUrl100)} alt={track.trackName} />
                <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 18%, rgba(0,0,0,0.15) 82%, rgba(0,0,0,0.65) 100%), rgba(0,0,0,0.2)', pointerEvents: 'none'}} />
                <div style={{position: 'absolute', display: 'flex', gap: 0, flexDirection: 'column', padding: '24px 42px 24px 42px', width: '100%', height: '100%', boxSizing: 'border-box'}}>
                    <Text size="s">{track.trackName}</Text>
                    <Text size="xs" color='lightGray'>{track.artistName}</Text>
                    <div style={{marginTop: 24, width: '100%', height: 5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden'}}>
                        <div style={{
                            width: `${isPlaying ? progress * 100 : 0}%`,
                            height: '100%',
                            borderRadius: 2,
                            backgroundColor: '#f9f9f9',
                            boxShadow: isPlaying ? '0 0 6px rgba(249,249,249,0.8)' : 'none',
                            transition: 'width 0.2s linear',
                        }} />
                    </div>
                </div>
                {/* <div className="song-cover-title">
                    <Text size="xs" color="dark">{track.trackName}</Text>
                </div>
                <div className="song-cover-subtitle">
                    <Text size="xs" color="gray">{track.artistName}</Text>
                </div> */}
            </div>
        </div>
    )
}

const Slides = ({tracks, playingTrackId, progress, onTrackClick}: {tracks: Track[], playingTrackId: number | null, progress: number, onTrackClick: (track: Track) => void}) => {
    return (
        <div style={{width: '100vw', height: '31vh', display: 'flex', alignItems: 'center', gap: 15, overflowX: 'auto', overflowY: 'visible', paddingTop: 20, paddingBottom: 8, paddingRight: 12, paddingLeft: 12, scrollbarWidth: 'none'}}>
            {tracks.map((track) => (
                <SongCover
                    key={track.trackId}
                    track={track}
                    isPlaying={playingTrackId === track.trackId}
                    progress={progress}
                    onClick={onTrackClick}
                />
            ))}
        </div>
    )
}

interface RoomPageProps {
    onNavigate?: (page: PageKey) => void;
}

export const RoomPage = ({onNavigate}: RoomPageProps = {}) => {
    const [videoEnded, setVideoEnded] = useState(false);
    const [imageBlurred, setImageBlurred] = useState(true);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!videoEnded) return;
        const timeout = setTimeout(() => setImageBlurred(false), 200);
        return () => clearTimeout(timeout);
    }, [videoEnded]);

    useEffect(() => {
        const getTrack = async () => {
            const term = 'lil peep';
            const params = new URLSearchParams({
                term,
                country: "nl",
                media: "music",
                entity: "song",
                limit: "20",
            });

            const response = await fetch(
                `https://itunes.apple.com/search?${params}`
            );

            if (!response.ok) {
                throw new Error(`iTunes API error: ${response.status}`);
            }
            const data = await response.json();
            console.log(data)

            setTracks(data.results as Track[]);
        }

        getTrack();
    }, []);

    const playTrack = (track: Track) => {
        if (playingTrackId === track.trackId) {
            audioRef.current?.pause();
            setPlayingTrackId(null);
            return;
        }

        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.addEventListener('timeupdate', () => {
                const audio = audioRef.current;
                if (audio && audio.duration) {
                    setProgress(audio.currentTime / audio.duration);
                }
            });
            audioRef.current.addEventListener('ended', () => {
                setPlayingTrackId(null);
                setProgress(0);
            });
        }

        audioRef.current.src = track.previewUrl;
        audioRef.current.play();
        setProgress(0);
        setPlayingTrackId(track.trackId);
    }

    return (
        <PageComponent>
            <Header onLeftClick={() => onNavigate?.('main')} />
            <Background videoEnded={videoEnded} imageBlurred={imageBlurred} onVideoEnded={() => setVideoEnded(true)}>
                <div style={{position: 'absolute', zIndex: 100, top: '50%', left: '50%', transform: "translateY(-50%) translateX(-50%)", opacity: videoEnded ? 0 : 1, transition: 'opacity 0.8s ease-in-out', pointerEvents: videoEnded ? 'none' : 'auto'}}>
                    <Text size="xl" animation >{'Послушаем музыку?'}</Text>
                </div>
                {videoEnded && <div className="slides-enter" style={{position: 'absolute', zIndex: 100, top: '12%', marginLeft: 0, marginRight: 0, width: '100%'}}>
                    <Slides tracks={tracks} playingTrackId={playingTrackId} progress={progress} onTrackClick={playTrack} />
                </div>}
            </Background>
        </PageComponent>
    )
}