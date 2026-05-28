import { useState } from 'react';
import {
    Alert,
    Avatar,
    AvatarStack,
    Badge,
    Button,
    Card,
    Checkbox,
    Field,
    Input,
    Kbd,
    Modal,
    Pills,
    Progress,
    ProgressRing,
    Radio,
    Search,
    Select,
    Skeleton,
    Table,
    TBody,
    TD,
    TH,
    THead,
    Tabs,
    Tag,
    Textarea,
    Toast,
    Toggle,
    CssTooltip as Tooltip,
    TR,
} from '@/components/ui';
import { LevelBadge, Streak } from '@/components/learning';
import {
    IconChevronDown,
    IconCheck,
    IconMail,
    IconMore,
    IconPlay,
} from '@/components/icons';
import { SectionHead } from './Hero';

export function ComponentsSection() {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <section className="section container" id="components">
            <SectionHead
                number="05"
                title="Components"
                subtitle="Every interactive element below speaks the same visual language. Drop them into Bootstrap layouts; they cohabit happily with the grid."
            />

            {/* Buttons */}
            <p className="eyebrow mb-2">Buttons</p>
            <div className="demo mb-4">
                <div className="demo-label">Variants</div>
                <div className="demo-row">
                    <Button variant="primary">Start lesson</Button>
                    <Button variant="secondary">Save for later</Button>
                    <Button variant="ghost">Skip</Button>
                    <Button variant="accent">Upgrade</Button>
                    <Button variant="danger">End session</Button>
                    <Button variant="link">Learn more →</Button>
                </div>
                <div className="demo-label mt-4">Sizes</div>
                <div className="demo-row" style={{ alignItems: 'center' }}>
                    <Button size="sm">Small</Button>
                    <Button>Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="xl">Extra large</Button>
                </div>
                <div className="demo-label mt-4">With icon &amp; states</div>
                <div className="demo-row">
                    <Button leadingIcon={<IconPlay size={14} />}>Continue</Button>
                    <Button variant="secondary" trailingIcon={<IconChevronDown size={12} />}>
                        Filter
                    </Button>
                    <Button variant="secondary" size="icon" aria-label="More">
                        <IconMore size={16} />
                    </Button>
                    <Button disabled>Disabled</Button>
                </div>
            </div>

            {/* Forms */}
            <p className="eyebrow mb-2">Forms &amp; inputs</p>
            <div className="grid grid-2 gap-3 mb-4">
                <Card>
                    <div className="stack" style={{ gap: 'var(--s-5)' }}>
                        <Field label="Full name" hint="Shown on your certificates." htmlFor="d-name">
                            <Input id="d-name" placeholder="Mariana Capuchino" defaultValue="Mariana Capuchino" />
                        </Field>
                        <Field label="Email" htmlFor="d-email">
                            <Input
                                id="d-email"
                                leadingIcon={<IconMail size={18} />}
                                placeholder="you@capuchino.app"
                            />
                        </Field>
                        <Field label="Current level" htmlFor="d-level">
                            <Select id="d-level" defaultValue="a2">
                                <option value="a1">Beginner (A1)</option>
                                <option value="a2">Elementary (A2)</option>
                                <option value="b1">Intermediate (B1)</option>
                                <option value="b2">Upper-intermediate (B2)</option>
                            </Select>
                        </Field>
                        <Field label="Password" error="Must be at least 8 characters.">
                            <Input invalid type="password" defaultValue="123" />
                        </Field>
                    </div>
                </Card>
                <Card>
                    <div className="stack" style={{ gap: 'var(--s-5)' }}>
                        <Field label="Notes to your coach">
                            <Textarea
                                placeholder="What do you want to work on this week?"
                                defaultValue="I'd like to practice past tenses, especially irregular verbs. Also feeling shy about pronunciation — would love a low-pressure drill."
                            />
                        </Field>
                        <Field label="Search">
                            <Search
                                placeholder="Find a lesson, word, or coach…"
                                shortcut={<>⌘K</>}
                            />
                        </Field>
                        <div className="row" style={{ gap: 'var(--s-5)' }}>
                            <Checkbox defaultChecked>Daily reminder at 8:00</Checkbox>
                            <Checkbox>Weekly review</Checkbox>
                        </div>
                        <div className="row" style={{ gap: 'var(--s-5)' }}>
                            <Radio name="duration" defaultChecked>5 min / day</Radio>
                            <Radio name="duration">15 min / day</Radio>
                            <Radio name="duration">30 min / day</Radio>
                        </div>
                        <div className="row" style={{ gap: 'var(--s-7)' }}>
                            <Toggle defaultChecked>Sound effects</Toggle>
                            <Toggle>Auto-advance</Toggle>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Badges / Avatars */}
            <p className="eyebrow mb-2">Badges, levels, tags &amp; avatars</p>
            <div className="demo mb-4">
                <div className="demo-label">Badges</div>
                <div className="demo-row">
                    <Badge dot>Draft</Badge>
                    <Badge variant="solid-primary">Pro</Badge>
                    <Badge variant="solid-accent">New</Badge>
                    <Badge variant="soft-success">Completed</Badge>
                    <Badge variant="soft-warning">Due today</Badge>
                    <Badge variant="soft-danger">Overdue</Badge>
                    <Badge variant="soft-info">Live coach</Badge>
                </div>
                <div className="demo-label mt-4">CEFR levels</div>
                <div className="demo-row">
                    {(['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const).map((lvl) => (
                        <LevelBadge key={lvl} level={lvl} />
                    ))}
                </div>
                <div className="demo-label mt-4">Tags</div>
                <div className="demo-row">
                    <Tag>grammar</Tag>
                    <Tag>past tense</Tag>
                    <Tag>conversation</Tag>
                    <Tag>5 min</Tag>
                    <Tag>+ add tag</Tag>
                </div>
                <div className="demo-label mt-4">Avatars</div>
                <div className="demo-row" style={{ gap: 'var(--s-5)' }}>
                    <div className="row" style={{ gap: 'var(--s-2)' }}>
                        <Avatar size="sm" tone="a">M</Avatar>
                        <Avatar size="md" tone="b">JK</Avatar>
                        <Avatar size="lg" tone="c">AR</Avatar>
                        <Avatar size="xl" tone="d">CP</Avatar>
                    </div>
                    <AvatarStack>
                        <Avatar tone="a">M</Avatar>
                        <Avatar tone="b">J</Avatar>
                        <Avatar tone="c">A</Avatar>
                        <Avatar tone="d">+4</Avatar>
                    </AvatarStack>
                </div>
            </div>

            {/* Tabs / Pills */}
            <p className="eyebrow mb-2">Navigation — tabs &amp; pills</p>
            <div className="grid grid-2 gap-3 mb-4">
                <div className="demo">
                    <div className="demo-label">Underline tabs</div>
                    <Tabs
                        defaultValue="overview"
                        items={[
                            { id: 'overview', label: 'Overview' },
                            { id: 'lessons', label: 'Lessons' },
                            { id: 'practice', label: 'Practice' },
                            { id: 'coaches', label: 'Coaches' },
                            { id: 'progress', label: 'Progress' },
                        ]}
                    />
                </div>
                <div className="demo">
                    <div className="demo-label">Segmented pills</div>
                    <Pills
                        defaultValue="a"
                        items={[
                            { id: 'all', label: 'All' },
                            { id: 'a', label: 'A1–A2' },
                            { id: 'b', label: 'B1–B2' },
                            { id: 'c', label: 'C1–C2' },
                        ]}
                    />
                </div>
            </div>

            {/* Progress */}
            <p className="eyebrow mb-2">Progress</p>
            <div className="grid grid-3 gap-3 mb-4">
                <Card>
                    <p className="small mb-2">Linear · 64%</p>
                    <Progress value={64} size="lg" />
                    <p className="small mt-3 mb-2">Thin · 28%</p>
                    <Progress value={28} size="sm" />
                </Card>
                <Card style={{ display: 'grid', placeItems: 'center' }}>
                    <ProgressRing value={70} />
                    <p className="small mt-3">
                        <strong style={{ color: 'var(--ink)' }}>7 of 10</strong> · weekly goal
                    </p>
                </Card>
                <Card style={{ textAlign: 'center' }}>
                    <Streak days={17} label="day streak" />
                    <p className="small mt-3">Longest: 42 · this month: 24</p>
                </Card>
            </div>

            {/* Alerts */}
            <p className="eyebrow mb-2">Feedback — alerts &amp; toasts</p>
            <div className="grid grid-2 gap-3 mb-4">
                <div className="stack">
                    <Alert tone="info" title="Your coach is ready">
                        Anya joined the room. You can start anytime — she'll wait.
                    </Alert>
                    <Alert tone="success" title="Nicely done">
                        You finished today's lesson in 4 minutes. That's three days in a row.
                    </Alert>
                </div>
                <div className="stack">
                    <Alert tone="warning" title="You're losing a streak">
                        A five-minute lesson before midnight keeps it alive.
                    </Alert>
                    <Alert tone="danger" title="Couldn't connect">
                        We'll keep trying. Your last answer is saved locally.
                    </Alert>
                </div>
            </div>

            {/* Toast + Modal trigger */}
            <div className="grid grid-2 gap-3 mb-4">
                <Card style={{ display: 'grid', placeItems: 'center', minHeight: 200, padding: 'var(--s-7)' }}>
                    <Toast icon={<IconCheck size={16} />}>Lesson saved to your library</Toast>
                </Card>
                <Card style={{ display: 'grid', placeItems: 'center', minHeight: 200, padding: 'var(--s-7)', background: 'var(--bg-sunken)' }}>
                    <Button variant="secondary" onClick={() => setModalOpen(true)}>
                        Open modal
                    </Button>
                </Card>
            </div>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                eyebrow="End session"
                title="Leave the lesson now?"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Keep going</Button>
                        <Button variant="primary" onClick={() => setModalOpen(false)}>Save &amp; exit</Button>
                    </>
                }
            >
                <p className="small mb-3">
                    You're 60% through. We'll save your place so you can finish later — no pressure.
                </p>
            </Modal>

            {/* Tooltip · skeleton · empty */}
            <p className="eyebrow mb-2">Tooltip · skeleton · empty</p>
            <div className="grid grid-3 gap-3 mb-4">
                <Card>
                    <div className="demo-label">Tooltip</div>
                    <div className="row" style={{ gap: 'var(--s-4)' }}>
                        <Tooltip label="Confidence level for this word">
                            <Button variant="secondary" size="sm">Hover me</Button>
                        </Tooltip>
                        <Tooltip label="A1 · Beginner">
                            <LevelBadge level="a1" />
                        </Tooltip>
                    </div>
                </Card>
                <Card>
                    <div className="demo-label">Skeleton</div>
                    <div className="stack" style={{ gap: 10 }}>
                        <Skeleton height={14} width="60%" />
                        <Skeleton height={10} width="100%" />
                        <Skeleton height={10} width="88%" />
                        <Skeleton height={10} width="72%" />
                    </div>
                </Card>
                <Card>
                    <div className="demo-label">Empty state</div>
                    <p className="h4" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, marginBottom: 6 }}>
                        No notes yet
                    </p>
                    <p className="small mb-3">Save a word from any lesson — it'll show up here for review.</p>
                    <Button variant="link">Browse vocabulary →</Button>
                </Card>
            </div>

            {/* Table */}
            <Card className="mb-4" style={{ padding: 0, overflow: 'hidden' }}>
                <Table>
                    <THead>
                        <TR>
                            <TH style={{ paddingLeft: 'var(--s-5)' }}>Lesson</TH>
                            <TH>Level</TH>
                            <TH>Type</TH>
                            <TH>Duration</TH>
                            <TH>Score</TH>
                            <TH></TH>
                        </TR>
                    </THead>
                    <TBody>
                        <TR>
                            <TD style={{ paddingLeft: 'var(--s-5)' }}>
                                <strong style={{ fontWeight: 500 }}>The art of the small talk</strong>
                                <br />
                                <span className="small">Restaurants, weather, weekends</span>
                            </TD>
                            <TD><LevelBadge level="a2" /></TD>
                            <TD><Badge>Conversation</Badge></TD>
                            <TD><span className="mono small">8 min</span></TD>
                            <TD><Badge variant="soft-success">92%</Badge></TD>
                            <TD><Button variant="ghost" size="sm">Review →</Button></TD>
                        </TR>
                        <TR>
                            <TD style={{ paddingLeft: 'var(--s-5)' }}>
                                <strong style={{ fontWeight: 500 }}>Past tense, on purpose</strong>
                                <br />
                                <span className="small">Irregular verbs in stories</span>
                            </TD>
                            <TD><LevelBadge level="b1" /></TD>
                            <TD><Badge>Grammar</Badge></TD>
                            <TD><span className="mono small">12 min</span></TD>
                            <TD><Badge variant="soft-warning">68%</Badge></TD>
                            <TD><Button variant="ghost" size="sm">Review →</Button></TD>
                        </TR>
                        <TR>
                            <TD style={{ paddingLeft: 'var(--s-5)' }}>
                                <strong style={{ fontWeight: 500 }}>Phrasal verbs over coffee</strong>
                                <br />
                                <span className="small">Pick up, run into, look forward</span>
                            </TD>
                            <TD><LevelBadge level="b2" /></TD>
                            <TD><Badge>Vocabulary</Badge></TD>
                            <TD><span className="mono small">10 min</span></TD>
                            <TD><Badge>In progress</Badge></TD>
                            <TD><Button variant="ghost" size="sm">Continue →</Button></TD>
                        </TR>
                    </TBody>
                </Table>
            </Card>

            {/* Kbd inline reference */}
            <p className="small ink-subtle">
                Press <Kbd>⌘K</Kbd> to open search anywhere in the app.
            </p>
        </section>
    );
}
