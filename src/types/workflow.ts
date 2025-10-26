// src/types/workflow.ts
export type TransitionType = "success" | "failure" | "optional";

export type WorkflowVm = { id: string; name: string };

export type StatusVm = {
    id: string;
    name: string;
    isStart: boolean;
    isEnd: boolean;
    x: number;
    y: number;
    roles: string[];
    color?: string | null;
};

export type TransitionVm = {
    id?: number | null;
    fromStatusId: string;
    toStatusId: string;
    type: TransitionType;   // BE đã map short -> string
    label?: string | null;
    rule?: string | null;
    roleNames?: string[] | null;
};

export type DesignerDto = {
    workflow: WorkflowVm;
    statuses: StatusVm[];
    transitions: TransitionVm[];
};
