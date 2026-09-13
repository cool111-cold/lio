import { createContext, useContext, useMemo, useState, ReactNode, CSSProperties } from 'react';
import { ComponentSource } from './componentSources';
import './style.css';

export interface TreeNode {
    id: string;
    name: string;
    source?: ComponentSource;
    children?: TreeNode[];
}

interface InspectorContextValue {
    selectedId: string | null;
    select: (id: string) => void;
    close: () => void;
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

export const useInspector = () => {
    const ctx = useContext(InspectorContext);
    if (!ctx) throw new Error('useInspector must be used within an InspectorProvider');
    return ctx;
};

export const InspectorProvider = ({children}: {children: ReactNode}) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const value = useMemo<InspectorContextValue>(() => ({
        selectedId,
        select: (id: string) => setSelectedId(id),
        close: () => setSelectedId(null),
    }), [selectedId]);

    return <InspectorContext.Provider value={value}>{children}</InspectorContext.Provider>;
};

interface InspectableProps {
    id: string;
    name: string;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const Inspectable = ({id, name, children, className, style}: InspectableProps) => {
    const {select, selectedId} = useInspector();

    return (
        <div
            className={`inspectable ${selectedId === id ? 'inspectable-active' : ''} ${className || ''}`}
            style={style}
            onClick={(e) => {
                e.stopPropagation();
                select(id);
            }}
        >
            <div className="inspectable-tag">{name}</div>
            {children}
        </div>
    );
};

const findNode = (node: TreeNode, id: string): TreeNode | null => {
    if (node.id === id) return node;
    for (const child of node.children || []) {
        const found = findNode(child, id);
        if (found) return found;
    }
    return null;
};

export const InspectorPanel = ({tree}: {tree: TreeNode}) => {
    const {selectedId, close} = useInspector();
    const selectedNode = useMemo(() => (selectedId ? findNode(tree, selectedId) : null), [selectedId, tree]);

    return (
        <div className={`inspector-panel ${selectedId ? 'inspector-panel-open' : ''}`}>
            <div className="inspector-header">
                <span className="inspector-title">Структура компонента</span>
                <div className="inspector-close" onClick={close}>✕</div>
            </div>
            <div className="inspector-body">
                {selectedNode && (
                    <div className="inspector-code">
                        <div className="inspector-code-header">
                            <span className="inspector-code-name">{selectedNode.name}</span>
                            {selectedNode.source && <span className="inspector-code-file">{selectedNode.source.file}</span>}
                        </div>
                        {selectedNode.source ? (
                            <pre className="inspector-code-block"><code>{selectedNode.source.code}</code></pre>
                        ) : (
                            <div className="inspector-code-empty">
                                У этого узла нет своего файла — он часть разметки родительского блока.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
