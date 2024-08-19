import $ from "jquery";

export function Codicon(icon: string): JQuery<HTMLElement> {
    return $(document.createElement("i")).addClass("codicon").addClass(`codicon-${icon}`);
}
