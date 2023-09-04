import { WHRect } from "./annotator-utils";

export interface Highlight {
    id: any;
    type: string;
    color: string;
    stroke?: number;
    strokeStyle?: string;
    rects: {
        [pageNum: number]: WHRect[]
    };
}