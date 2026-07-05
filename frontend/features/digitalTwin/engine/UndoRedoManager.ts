// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/UndoRedoManager.ts
// ============================================================================

export interface UndoableAction{

    undo():void;

    redo():void;

}

export class UndoRedoManager{

    private undoStack:UndoableAction[]=[];

    private redoStack:UndoableAction[]=[];

    execute(action:UndoableAction){

        action.redo();

        this.undoStack.push(action);

        this.redoStack=[];

    }

    undo(){

        const action=this.undoStack.pop();

        if(!action)return;

        action.undo();

        this.redoStack.push(action);

    }

    redo(){

        const action=this.redoStack.pop();

        if(!action)return;

        action.redo();

        this.undoStack.push(action);

    }

}
