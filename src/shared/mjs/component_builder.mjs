import fs from 'fs'

export function send_component(paths, root) {
    let components = [];
    let component = {
        html: "",
        js: ""
    };
    
    for (let i = 0; i < paths.length; i++) {
        let path = "";
        if (paths[i]["type"] == "non-shared") {
            path = `${root}/sites/components/${paths[i]["name"]}`;
        } else {
            path = `${root}/shared/components/${paths[i]["name"]}`;

        }
        const data = fs.readFileSync(path, "utf8");
        let index_of_js = data.indexOf("<script>");
        
        component.html = data.substring(0, index_of_js);
        component.js = data.substring(data.indexOf("<script>") + 8, data.length - 9);

        paths[i]["tags"].forEach(tag => {
            let tag_key = Object.keys(tag)[0];
            component.html = component.html.replaceAll(`{{ ${tag_key} }}`, tag[tag_key]);
            component.js = component.js.replaceAll(`{{ ${tag_key} }}`, tag[tag_key]);

        });
        
        components.push(component);
        
        component = {
            html: "",
            js: ""
        };
    }
   return components;
}