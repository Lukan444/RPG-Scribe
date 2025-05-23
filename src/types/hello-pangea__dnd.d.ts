declare module '@hello-pangea/dnd' {
  import * as React from 'react';

  export type DraggableId = string;
  export type DroppableId = string;
  export type DragStart = any;
  export type DropResult = {
    draggableId: DraggableId;
    type: string;
    source: {
      droppableId: DroppableId;
      index: number;
    };
    destination?: {
      droppableId: DroppableId;
      index: number;
    };
  };

  export type DraggableProvided = {
    draggableProps: any;
    dragHandleProps: any;
    innerRef: React.RefObject<any>;
  };

  export type DroppableProvided = {
    droppableProps: any;
    innerRef: React.RefObject<any>;
    placeholder: React.ReactNode;
  };

  export type DraggableStateSnapshot = {
    isDragging: boolean;
    isDropAnimating: boolean;
    draggingOver: DroppableId | null;
    dropAnimation: any | null;
    draggingOverWith: DraggableId | null;
    combineWith: DraggableId | null;
    combineTargetFor: DraggableId | null;
    mode: string | null;
  };

  export type DroppableStateSnapshot = {
    isDraggingOver: boolean;
    draggingOverWith: DraggableId | null;
    draggingFromThisWith: DraggableId | null;
    isUsingPlaceholder: boolean;
  };

  export interface DragDropContextProps {
    onBeforeCapture?: (before: any) => void;
    onBeforeDragStart?: (initial: DragStart) => void;
    onDragStart?: (initial: DragStart) => void;
    onDragUpdate?: (update: any) => void;
    onDragEnd: (result: DropResult) => void;
    children: React.ReactNode;
  }

  export interface DroppableProps {
    droppableId: DroppableId;
    type?: string;
    mode?: 'standard' | 'virtual';
    isDropDisabled?: boolean;
    isCombineEnabled?: boolean;
    direction?: 'horizontal' | 'vertical';
    ignoreContainerClipping?: boolean;
    renderClone?: any;
    getContainerForClone?: any;
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactNode;
  }

  export interface DraggableProps {
    draggableId: DraggableId;
    index: number;
    isDragDisabled?: boolean;
    disableInteractiveElementBlocking?: boolean;
    shouldRespectForcePress?: boolean;
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactNode;
  }

  export class DragDropContext extends React.Component<DragDropContextProps> {}
  export class Droppable extends React.Component<DroppableProps> {}
  export class Draggable extends React.Component<DraggableProps> {}
}