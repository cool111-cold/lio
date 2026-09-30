import { CSSProperties, useState } from "react"
import { Text, Button, Input, PhoneMockup } from "../../../components"
import '../../get-qr-admin/login.css'
import './setup-demo.css'

type Stage = 'scan' | 'register' | 'admin' | 'done'

const STAGES: Stage[] = ['scan', 'register', 'admin', 'done']

const HINTS: Record<Stage, string> = {
    scan: 'Отсканируйте QR-код на карте',
    register: 'Зарегистрируйтесь в админ-панели',
    admin: 'Добавьте первую ссылку',
    done: 'Готово — страница работает',
}

const DEMO_LINKS = []

const themeVars = {
    '--lio-text': '#f9f9f9',
    '--lio-input-bg': 'rgba(255, 255, 255, 0.05)',
} as unknown as CSSProperties

// Декоративный QR: 25x25 модулей с тремя поисковыми квадратами по углам
const QR_SIZE = 25
const isFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= QR_SIZE - 7 && y < 7) || (x < 7 && y >= QR_SIZE - 7)

const QR_MODULES = (() => {
    const cells: Array<[number, number]> = []
    let seed = 7
    for (let y = 0; y < QR_SIZE; y++) {
        for (let x = 0; x < QR_SIZE; x++) {
            seed = (seed * 9301 + 49297) % 233280
            if (!isFinder(x, y) && seed / 233280 > 0.52) cells.push([x, y])
        }
    }
    return cells
})()

const QR_FINDERS: Array<[number, number]> = [[0, 0], [QR_SIZE - 7, 0], [0, QR_SIZE - 7]]

const QrCode = () => (
    <svg className="setup-demo-qr" viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} shapeRendering="crispEdges" aria-hidden="true">
        {QR_MODULES.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)}
        {QR_FINDERS.map(([x, y]) => (
            <g key={`f-${x}-${y}`}>
                <path d={`M${x} ${y}h7v7h-7z M${x + 1} ${y + 1}v5h5v-5z`} fillRule="evenodd" />
                <rect x={x + 2} y={y + 2} width="3" height="3" />
            </g>
        ))}
    </svg>
)

export const SetupDemo = () => {
    const [clicks, setClicks] = useState(0)
    const stage = STAGES[clicks]

    const next = () => setClicks((c) => Math.min(c + 1, STAGES.length - 1))

    return (
        <div className="setup-demo">
            <div className="setup-demo-stage">
                <div className="setup-demo-counter" aria-hidden="true">
                    <span className="setup-demo-counter-value" key={clicks}>{clicks}</span>
                </div>

                <PhoneMockup width={300} className="setup-demo-phone">
                    <div className="setup-demo-screen" key={stage}>
                        {stage === 'scan' && (
                            <div className="setup-demo-scan">
                                <div className="setup-demo-scan-title">
                                    <Text size="m" color="white">Наведите камеру на карту</Text>
                                    <Text size="s" color="lightGray">или приложите ее к телефону</Text>
                                </div>
                                <div className="setup-demo-qr-frame">
                                    <QrCode />
                                    <span className="setup-demo-scan-line" />
                                </div>
                                <div className="setup-demo-action">
                                    <Button variant="solid" fullWidth textSize="m" onClick={next}>Отсканировать</Button>
                                </div>
                            </div>
                        )}

                        {stage === 'register' && (
                            <div className="setup-demo-register">
                                <div className="admin-login-card" style={themeVars}>
                                    <Text size="l" color="white">Админ-панель</Text>

                                    <div className="admin-login-tabs">
                                        <div className="admin-login-tab">
                                            <Button variant="ghost" fullWidth textSize="s" textColor="lightGray">Вход</Button>
                                        </div>
                                        <div className="admin-login-tab admin-login-tab-active">
                                            <Button variant="ghost" fullWidth textSize="s" textColor="white">Регистрация</Button>
                                        </div>
                                    </div>

                                    <div className="admin-login-form">
                                        <Input label="Логин" value="my_cafe" readOnly tabIndex={-1} />
                                        <Input label="Пароль" type="password" value="password" readOnly tabIndex={-1} />
                                        <Input label="Повтор пароля" type="password" value="password" readOnly tabIndex={-1} />
                                        <Button variant="solid" fullWidth textSize="m" onClick={next}>Зарегистрироваться</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(stage === 'admin' || stage === 'done') && (
                            <div className="setup-demo-admin">
                                <div className="setup-demo-avatar">MC</div>
                                <Text size="l" color="white">My Cafe</Text>
                                <Text size="xs" color="lightGray">Кофейня у дома</Text>

                                <div className="setup-demo-links">
                                    {/* {DEMO_LINKS.map((label) => (
                                        <div className="setup-demo-link" key={label}>
                                            <span className="setup-demo-link-icon" />
                                            <Text size="m" color="white">{label}</Text>
                                        </div>
                                    ))} */}

                                    {stage === 'done' ? (
                                        <div className="setup-demo-link setup-demo-link-new">
                                            <span className="setup-demo-link-icon" />
                                            <Text size="m" color="white">Подзравляем! Ваша визитка готова</Text>
                                        </div>
                                    ) : (
                                        <button type="button" className="setup-demo-link setup-demo-link-add" onClick={next}>
                                            <span className="setup-demo-link-plus">+</span>
                                            <Text size="m" color="white">Добавить ссылку</Text>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </PhoneMockup>
            </div>

            <div className="setup-demo-caption">
                {/* <Text size="s" color="lightGray">
                    {stage === 'done' ? `Настроено за ${clicks} клика` : `Шаг ${clicks + 1} из ${STAGES.length - 1}: ${HINTS[stage]}`}
                </Text> */}
                <Text size="m" color="white">
                    {`Счетчик кликов ${clicks}`}
                </Text>
                {stage === 'done' && (
                    <button type="button" className="setup-demo-restart" onClick={() => setClicks(0)}>
                        <Text size="s" color="accent">Повторить</Text>
                    </button>
                )}
            </div>
        </div>
    )
}
