import { useState } from "react"
import {
    PageComponent,
    Text,
    Button,
    Section,
    Card,
    Tag,
    Inspectable,
    InspectorProvider,
    InspectorPanel,
    TreeNode,
    ComponentSource,
    COMPONENT_SOURCES,
} from "../../components"
import { PageKey } from "../../helpers"
import vIcon from '../../assets/icons/v-icon.svg';
import aboutImg from '../../assets/img/8.jpg';
import project1Img from '../../assets/img/4.jpg';
import project2Img from '../../assets/img/5.jpg';
import project3Img from '../../assets/img/6.jpg';
import project4Img from '../../assets/img/7.jpg';
import roomPreviewImg from '../../assets/img/10.jpg';
import cubePreviewImg from '../../assets/img/2.jpg';
import './style.css';

const NAV_LINKS = [
    {href: '#about', label: 'Обо мне'},
    {href: '#skills', label: 'Навыки'},
    {href: '#projects', label: 'Проекты'},
    {href: '#explore', label: 'Ещё'},
]

const SKILLS = ['React', 'TypeScript', 'Three.js', 'React Three Fiber', 'Node.js', 'Figma', 'WebGL', 'Framer Motion']

const PROJECTS = [
    {
        title: 'Кубический шоурум',
        description: 'Интерактивная 3D‑витрина товаров на Three.js с покадровой подсветкой граней.',
        image: project1Img,
        tags: ['Three.js', 'React'],
    },
    {
        title: 'Комната с музыкой',
        description: 'Атмосферная страница с видео‑фоном и плеером треков из iTunes API.',
        image: project2Img,
        tags: ['API', 'Audio'],
    },
    {
        title: 'Дизайн‑система',
        description: 'Библиотека переиспользуемых UI‑компонентов для быстрой сборки страниц.',
        image: project3Img,
        tags: ['UI Kit', 'TypeScript'],
    },
    {
        title: 'Лендинг бренда',
        description: 'Одностраничный сайт с анимациями появления и адаптивной версткой.',
        image: project4Img,
        tags: ['Landing', 'Animation'],
    },
]

const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({behavior: 'smooth'})
}

// Illustrative JSX snippets for page-specific blocks that aren't standalone components
// (kept next to the tree that references them; real shared components read from COMPONENT_SOURCES instead).
const SECTION_SOURCES: Record<string, ComponentSource> = {
    MainPage: {
        file: 'src/pages/main/index.tsx',
        code: `<PageComponent center={false}>
    <InspectorProvider>
        <div className="main-scroll">
            <Inspectable id="navbar" name="NavBar">...</Inspectable>
            <Inspectable id="hero" name="HeroSection">...</Inspectable>
            <Inspectable id="about" name="AboutSection">...</Inspectable>
            <Inspectable id="skills" name="SkillsSection">...</Inspectable>
            <Inspectable id="projects" name="ProjectsSection">...</Inspectable>
            <Inspectable id="explore" name="ExploreSection">...</Inspectable>
            <Inspectable id="footer" name="Footer">...</Inspectable>
        </div>
        <InspectorPanel tree={PAGE_TREE} />
    </InspectorProvider>
</PageComponent>`,
    },
    NavBar: {
        file: 'src/pages/main/index.tsx',
        code: `<Inspectable id="navbar" name="NavBar" className="navbar">
    <div className="logo-mark">
        <img src={vIcon} className="navbar-logo" alt="logo" />
        <img src={vIcon} className="navbar-logo" style={{transform: 'rotate(180deg)'}} alt="logo" />
    </div>
    <div className="navbar-links">
        {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="jost navbar-link">{link.label}</a>
        ))}
    </div>
</Inspectable>`,
    },
    'Nav links': {
        file: 'src/pages/main/index.tsx',
        code: `{NAV_LINKS.map((link) => (
    <a key={link.href} href={link.href} className="jost navbar-link">{link.label}</a>
))}`,
    },
    Logo: {
        file: 'src/pages/main/index.tsx',
        code: `<div className="logo-mark">
    <img src={vIcon} className="hero-logo" alt="logo" />
    <img src={vIcon} className="hero-logo" style={{transform: 'rotate(180deg)'}} alt="logo" />
</div>`,
    },
    HeroSection: {
        file: 'src/pages/main/index.tsx',
        code: `<Inspectable id="hero" name="HeroSection" className="hero">
    <div className="hero-inner">
        <Inspectable id="hero.logo" name="Logo">
            <div className="logo-mark">
                <img src={vIcon} className="hero-logo" alt="logo" />
                <img src={vIcon} className="hero-logo" style={{transform: 'rotate(180deg)'}} alt="logo" />
            </div>
        </Inspectable>
        <Inspectable id="hero.eyebrow" name="Text">
            <Text size="xs" color="lightGray">Frontend / Creative Developer</Text>
        </Inspectable>
        <Inspectable id="hero.title" name="Text">
            <Text size="xl" animation>Вадим Писарев</Text>
        </Inspectable>
        <Inspectable id="hero.subtitle" name="Text">
            <Text size="m" color="gray">Создаю интерфейсы на стыке дизайна, 3D и инженерии</Text>
        </Inspectable>
        <Inspectable id="hero.cta" name="Button">
            <Button onClick={() => scrollToId('projects')}>Смотреть проекты</Button>
        </Inspectable>
    </div>
</Inspectable>`,
    },
    AboutSection: {
        file: 'src/pages/main/index.tsx',
        code: `<Inspectable id="about" name="AboutSection">
    <Section id="about" eyebrow="Обо мне" title="Кто я">
        <div className="about-grid">
            <Inspectable id="about.image" name="Image" className="about-image-wrap">
                <img src={aboutImg} className="about-image" alt="Портрет" />
            </Inspectable>
            <Inspectable id="about.text" name="Text" className="about-text">
                <Text size="s" color="lightGray">...</Text>
            </Inspectable>
        </div>
    </Section>
</Inspectable>`,
    },
    Image: {
        file: 'src/pages/main/index.tsx',
        code: `<img src={aboutImg} className="about-image" alt="Портрет" />`,
    },
    SkillsSection: {
        file: 'src/pages/main/index.tsx',
        code: `<Inspectable id="skills" name="SkillsSection">
    <Section id="skills" eyebrow="Навыки" title="Инструменты и технологии">
        <Inspectable id="skills.tags" name="Tag list" className="skills-tags">
            {SKILLS.map((skill) => <Tag key={skill}>{skill}</Tag>)}
        </Inspectable>
    </Section>
</Inspectable>`,
    },
    'Tag list': {
        file: 'src/pages/main/index.tsx',
        code: `{SKILLS.map((skill) => <Tag key={skill}>{skill}</Tag>)}`,
    },
    ProjectsSection: {
        file: 'src/pages/main/index.tsx',
        code: `<Inspectable id="projects" name="ProjectsSection">
    <Section id="projects" eyebrow="Проекты" title="Избранные работы">
        <div className="projects-grid">
            {PROJECTS.map((project, i) => (
                <Inspectable key={project.title} id={\`projects.card.\${i}\`} name="Card">
                    <Card
                        image={project.image}
                        title={project.title}
                        description={project.description}
                        tags={project.tags}
                        action="Подробнее"
                    />
                </Inspectable>
            ))}
        </div>
    </Section>
</Inspectable>`,
    },
    ExploreSection: {
        file: 'src/pages/main/index.tsx',
        code: `<Inspectable id="explore" name="ExploreSection">
    <Section id="explore" eyebrow="Ещё" title="Исследуйте другие страницы">
        <div className="projects-grid">
            <Inspectable id="explore.room" name="Card">
                <Card
                    image={roomPreviewImg}
                    title="Комната"
                    description="Атмосферная страница с видео‑фоном и плеером треков."
                    action="Перейти"
                    onClick={() => onNavigate?.('room')}
                />
            </Inspectable>
            <Inspectable id="explore.3d" name="Card">
                <Card
                    image={cubePreviewImg}
                    title="3D сцена"
                    description="Интерактивный куб с фоновыми изображениями на гранях."
                    action="Перейти"
                    onClick={() => onNavigate?.('3d')}
                />
            </Inspectable>
        </div>
    </Section>
</Inspectable>`,
    },
    Footer: {
        file: 'src/pages/main/index.tsx',
        code: `<Inspectable id="footer" name="Footer" className="footer">
    <img src={vIcon} className="footer-logo" alt="logo" />
    <img src={vIcon} className="footer-logo" style={{transform: 'rotate(180deg)'}} alt="logo" />
    <Text size="xs" color="lightGray">© 2026 Вадим Писарев. Собрано на React.</Text>
</Inspectable>`,
    },
}

const resolveSource = (name: string): ComponentSource | undefined => COMPONENT_SOURCES[name] ?? SECTION_SOURCES[name]

const node = (id: string, name: string, children?: TreeNode[]): TreeNode => ({
    id,
    name,
    children,
    source: resolveSource(name),
})

const buildPageTree = (): TreeNode => node('page', 'MainPage', [
    node('navbar', 'NavBar', [
        node('navbar.logo', 'Logo'),
        node('navbar.links', 'Nav links'),
    ]),
    node('hero', 'HeroSection', [
        node('hero.logo', 'Logo'),
        node('hero.eyebrow', 'Text'),
        node('hero.title', 'Text'),
        node('hero.subtitle', 'Text'),
        node('hero.cta', 'Button'),
    ]),
    node('about', 'AboutSection', [
        node('about.heading.eyebrow', 'Text'),
        node('about.heading.title', 'Text'),
        node('about.image', 'Image'),
        node('about.text', 'Text'),
    ]),
    node('skills', 'SkillsSection', [
        node('skills.heading.eyebrow', 'Text'),
        node('skills.heading.title', 'Text'),
        node('skills.tags', 'Tag list', SKILLS.map((_, i) => node(`skills.tag.${i}`, 'Tag'))),
    ]),
    node('projects', 'ProjectsSection', [
        node('projects.heading.eyebrow', 'Text'),
        node('projects.heading.title', 'Text'),
        ...PROJECTS.map((p, i) => node(`projects.card.${i}`, 'Card', [
            node(`projects.card.${i}.image`, 'Image'),
            node(`projects.card.${i}.title`, 'Text'),
            node(`projects.card.${i}.description`, 'Text'),
            node(`projects.card.${i}.tags`, 'Tag list', p.tags.map((_, j) => node(`projects.card.${i}.tag.${j}`, 'Tag'))),
            node(`projects.card.${i}.action`, 'Text'),
        ])),
    ]),
    node('explore', 'ExploreSection', [
        node('explore.heading.eyebrow', 'Text'),
        node('explore.heading.title', 'Text'),
        node('explore.room', 'Card', [
            node('explore.room.image', 'Image'),
            node('explore.room.title', 'Text'),
            node('explore.room.description', 'Text'),
            node('explore.room.action', 'Text'),
        ]),
        node('explore.3d', 'Card', [
            node('explore.3d.image', 'Image'),
            node('explore.3d.title', 'Text'),
            node('explore.3d.description', 'Text'),
            node('explore.3d.action', 'Text'),
        ]),
    ]),
    node('footer', 'Footer', [
        node('footer.logo', 'Logo'),
        node('footer.text', 'Text'),
    ]),
])

const PAGE_TREE = buildPageTree()

interface MainPageProps {
    onNavigate?: (page: PageKey) => void;
}

export const MainPage = ({onNavigate}: MainPageProps = {}) => {
    const [hintVisible, setHintVisible] = useState(true)

    return (
        <PageComponent center={false}>
            <InspectorProvider>
                <div className="main-scroll">
                    <Inspectable id="navbar" name="NavBar" className="navbar">
                        <div className="logo-mark">
                            <img src={vIcon} className="navbar-logo" alt="logo" />
                            <img src={vIcon} className="navbar-logo" style={{transform: 'rotate(180deg)'}} alt="logo" />
                        </div>
                        <div className="navbar-links">
                            {NAV_LINKS.map((link) => (
                                <a key={link.href} href={link.href} className="jost navbar-link">{link.label}</a>
                            ))}
                        </div>
                    </Inspectable>

                    <Inspectable id="hero" name="HeroSection" className="hero">
                        <div className="hero-inner">
                            <Inspectable id="hero.logo" name="Logo">
                                <div className="logo-mark">
                                    <img src={vIcon} className="hero-logo" alt="logo" />
                                    <img src={vIcon} className="hero-logo" style={{transform: 'rotate(180deg)'}} alt="logo" />
                                </div>
                            </Inspectable>
                            <Inspectable id="hero.eyebrow" name="Text">
                                <Text size="xs" color="lightGray">Frontend / Creative Developer</Text>
                            </Inspectable>
                            <Inspectable id="hero.title" name="Text">
                                <Text size="xl" animation>Вадим Писарев</Text>
                            </Inspectable>
                            <Inspectable id="hero.subtitle" name="Text">
                                <Text size="m" color="gray">Создаю интерфейсы на стыке дизайна, 3D и инженерии</Text>
                            </Inspectable>
                            <Inspectable id="hero.cta" name="Button">
                                <Button onClick={() => scrollToId('projects')}>Смотреть проекты</Button>
                            </Inspectable>
                        </div>
                    </Inspectable>

                    <Inspectable id="about" name="AboutSection">
                        <Section id="about" eyebrow="Обо мне" title="Кто я">
                            <div className="about-grid">
                                <Inspectable id="about.image" name="Image" className="about-image-wrap">
                                    <img src={aboutImg} className="about-image" alt="Портрет" />
                                </Inspectable>
                                <Inspectable id="about.text" name="Text" className="about-text">
                                    <Text size="s" color="lightGray">
                                        Более 5 лет создаю цифровые продукты — от лендингов до 3D‑витрин. Люблю превращать сложные идеи в простые и живые интерфейсы, где анимация и код работают на пользователя, а не отвлекают его.
                                    </Text>
                                </Inspectable>
                            </div>
                        </Section>
                    </Inspectable>

                    <Inspectable id="skills" name="SkillsSection">
                        <Section id="skills" eyebrow="Навыки" title="Инструменты и технологии">
                            <Inspectable id="skills.tags" name="Tag list" className="skills-tags">
                                {SKILLS.map((skill) => <Tag key={skill}>{skill}</Tag>)}
                            </Inspectable>
                        </Section>
                    </Inspectable>

                    <Inspectable id="projects" name="ProjectsSection">
                        <Section id="projects" eyebrow="Проекты" title="Избранные работы">
                            <div className="projects-grid">
                                {PROJECTS.map((project, i) => (
                                    <Inspectable key={project.title} id={`projects.card.${i}`} name="Card">
                                        <Card
                                            image={project.image}
                                            title={project.title}
                                            description={project.description}
                                            tags={project.tags}
                                            action="Подробнее"
                                        />
                                    </Inspectable>
                                ))}
                            </div>
                        </Section>
                    </Inspectable>

                    <Inspectable id="explore" name="ExploreSection">
                        <Section id="explore" eyebrow="Ещё" title="Исследуйте другие страницы">
                            <div className="projects-grid">
                                <Inspectable id="explore.room" name="Card">
                                    <Card
                                        image={roomPreviewImg}
                                        title="Комната"
                                        description="Атмосферная страница с видео‑фоном и плеером треков."
                                        action="Перейти"
                                        onClick={() => onNavigate?.('room')}
                                    />
                                </Inspectable>
                                <Inspectable id="explore.3d" name="Card">
                                    <Card
                                        image={cubePreviewImg}
                                        title="3D сцена"
                                        description="Интерактивный куб с фоновыми изображениями на гранях."
                                        action="Перейти"
                                        onClick={() => onNavigate?.('3d')}
                                    />
                                </Inspectable>
                            </div>
                        </Section>
                    </Inspectable>

                    <Inspectable id="footer" name="Footer" className="footer">
                        <div style={{display: 'flex', flexDirection: 'row'}}>
                            <img src={vIcon} className="footer-logo" alt="logo" />
                            <img src={vIcon} className="footer-logo" style={{transform: 'rotate(180deg)'}} alt="logo" />
                        </div>
                        <Text size="xs" color="lightGray">© 2026 Вадим Писарев. Собрано на React.</Text>
                    </Inspectable>
                </div>

                {hintVisible && (
                    <div className="inspector-hint">
                        <Text size="xs" color="lightGray">Кликните по любому блоку — справа появится его структура</Text>
                        <div className="inspector-hint-close" onClick={() => setHintVisible(false)}>✕</div>
                    </div>
                )}

                <InspectorPanel tree={PAGE_TREE} />
            </InspectorProvider>
        </PageComponent>
    )
}
