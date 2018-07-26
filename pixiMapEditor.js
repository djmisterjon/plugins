/*:
// PLUGIN □────────────────────────────────□PIXI MAP EDITOR□─────────────────────────────────────────┐
* @author □ Jonathan Lepage (dimisterjon),(jonforum) 
* @plugindesc EDITOR GUI for create map with object sprine JSON (texture packer, spine)
* V.1.1.5A
* License:© M.I.T
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
NOTE AND HELP:
    this.CAGE_MOUSE.name = "CAGE_MOUSE";
    this.CAGE_MAP.name = "CAGE_MAP";
    this.CAGE_GUI.name = "CAGE_GUI";

*/

 // START INITIALISE EDITOR (FROM RMMV PLUGIN MANAGER)
document.addEventListener('keydown', initializeEditor);
function initializeEditor(event){
    if(event.key === "F1" && !$PME.started){
        console.log1('__________________initializeEditor:__________________ ');
        (function() {
            $PME.started = true;
            $gameSystem && ($gameSystem._menuEnabled = false); // disable rmmv menu
            const javascript = [
                "js/iziToast/iziToast.js",
                "js/iziToast/pixiMapEditor_HTML.js",
                "js/iziToast/pixiMapEditor_TOAST.js",
                "js/jscolor/bootstrap-slider.js",
                "js/jscolor/jscolor.js",
            ];
            const css = [
                'js/iziToast/iziToast.css',
                "js/iziToast/bootstrap.min.css",
                "js/jscolor/bootstrap-slider.css",
                "editor/customEditorCSS.css",
            ];
            function onComplette(){
                $PME.startEditorLoader();
            };
            const head = document.getElementsByTagName('head')[0];
            let total = javascript.length + css.length;
            for (let i = 0, l = css.length; i < l; i++) {
                let link = document.createElement('link');
                link.onload = function() {
                    total--;
                    !total && onComplette();
                  };
               // link.async = false;
                //tmp = link.cloneNode(true);
                link.href = css[i];
                link.rel = 'stylesheet';
                head.appendChild(link);
            }
            for (let i = 0, l = javascript.length; i < l; i++) {
                let script = document.createElement('script');
                script.onload = function() {
                    total--;
                    !total && onComplette();
                  };
                script.async = false;
                script._url = javascript[i];
                script.src = javascript[i];
                script.href = javascript[i];
                document.body.appendChild(script);
            }
            
        })();
    };
};

// ┌------------------------------------------------------------------------------┐
// GLOBAL $PME CLASS: _SLL for SPRITE LIBRARY LOADER
//└------------------------------------------------------------------------------┘
class _PME{
    constructor() {
        this._tmpRes_normal = {};
        this._tmpRes_multiPack = {};
        this._tmpRes = {};
        this._tmpData = {}; // store tmp data for loader , wait to compute
        this.Data2 = {};
        this.editor = {}; // store editor
    };
  };
  const $PME = new _PME(); // global ↑↑↑
  console.log2('$PME.', $PME);

// ┌------------------------------------------------------------------------------┐
// wait JSONlibraryLoader befor initialise pixiMapEditor
//└------------------------------------------------------------------------------┘


_PME.prototype.startEditorLoader = function() {
    iziToast.warning( this.izit_loading1() );
    const loader = new PIXI.loaders.Loader();
    loader.add('editorGui', `editor/pixiMapEditor1.json`);
    loader.load();
    loader.onProgress.add((loader, res) => {
        if (res.extension === "png") { this.editor[res.name] = res.texture};
        if (res.spineData) { this.editor[res.name] = res.spineData};
    });
    loader.onComplete.add(() => {
        this.load_nwJSFolderLibs();
    });
 };

 _PME.prototype.load_nwJSFolderLibs = function() {
    const loadingStatus =  document.getElementById('izit_loading1');
    const path = require('path'), fs=require('fs');
    var fromDir = function(startPath,filter){
        if (!fs.existsSync(startPath)){
            return; console.log("no dir ",startPath);
        };
        let files=fs.readdirSync(startPath);
        for(let i=0;i<files.length;i++){
            let filename=path.join(startPath,files[i]);
            let stat = fs.lstatSync(filename);
            if (stat.isDirectory()){
                fromDir(filename,filter); //recurse
            }
            else if (filename.indexOf(filter)>=0) {
                let filenameFormated =  filename.replace(/\\/g, "/");
                let dirArray = filenameFormated.split("/"); // repertoire path formated for array [,,,]
                let fileData = path.parse(filenameFormated); // split data
                    dirArray.pop();
                    fileData.dirArray = dirArray;
                if( (fileData.dirArray.contains("SOURCE") || fileData.dirArray.contains("source")) ){continue};// (exlude all json in source folder)
                if( fileData.name.contains("-") && !fileData.name.contains("-0")  ){continue};// (exlude multiPack)

                fileData.root = `${fileData.dir}/${fileData.base}`
                this._tmpData[fileData.name] = fileData;
                //const loadProgressTxt = document.createElement("div");
                //loadProgressTxt.innerHTML = `<p><span style="color:#fff">${fileData.name}</span> ==><span style="color:#989898">"${filename}"</span></p>`;
                //loadingStatus.appendChild(loadProgressTxt);
            };
        };
    }.bind(this);
    fromDir('data2','.json'); //START
    this.loadDataJson();
 };


 //#1 start load all json data
 _PME.prototype.loadDataJson = function() {
    const loader = new PIXI.loaders.Loader();
    for (const key in this._tmpData) {
        const dataJ = this._tmpData[key];
        loader.add(key, `${dataJ.dir}/${dataJ.base}`);
    };
    loader.load();

    loader.onProgress.add((loader, res) => {
        if(res.extension.contains("json")){
            this.asignBase(res);
            this._tmpRes[res.name] = res;
        };
    });
    loader.onComplete.add((loader, res) => {
       this.loadMultiPack();
    });
 };


//#2 load all multiPack reference
_PME.prototype.loadMultiPack = function() {
    const loader = new PIXI.loaders.Loader();
    for (const key in this._tmpData) {
        const isMulti = key.contains("-0");
        if(isMulti){
            const list =  this._tmpRes[key].data.meta.related_multi_packs;
            list.forEach(fileName => {
                const dir = `${this._tmpData[key].dir}/${fileName}`
                loader.add(fileName, dir);
                loader.resources[fileName].FROM = this._tmpRes[key];
            });
        }
    };
    loader.load();

    loader.onProgress.add((loader, res) => {
        res.extension.contains("json") && (this._tmpRes_multiPack[res.name] = res);
    });
    loader.onComplete.add((loader, res) => {
        this.loadNormal();
     });
};

  //#3 load normal png
_PME.prototype.loadNormal = function() {
    const loader = new PIXI.loaders.Loader();
    for (const key in this._tmpRes) {
        const meta = this._tmpRes[key].data.meta;
        if(meta && meta.normal_map){
            const path = this._tmpRes[key].url.split("/");
            const dir = `${path[0]}/${path[1]}/${path[2]}/${meta.normal_map}`;
            loader.add(meta.normal_map, dir);
            loader.resources[meta.normal_map].FROM = this._tmpRes[key];
        }
    };
    for (const key in this._tmpRes_multiPack) {
        const meta = this._tmpRes_multiPack[key].data.meta;
        if(meta && meta.normal_map){
            const path = this._tmpRes_multiPack[key].url.split("/");
            const dir = `${path[0]}/${path[1]}/${path[2]}/${meta.normal_map}`;
            loader.add(meta.normal_map, dir);
            loader.resources[meta.normal_map].FROM = this._tmpRes_multiPack[key];
        }
    };
    loader.load();

    loader.onProgress.add((loader, res) => {
        this._tmpRes_normal[res.name] = res;
    });
    loader.onComplete.add((loader, res) => {
        this.computeRessources();
    });
};

// we have data, multipack, normal, now merging
_PME.prototype.computeRessources = function() {
    this.computeNormal();
    this.computeMultiPack();
    this.computeData();

    this.startGui();
 };

    // asign base type data and normalise structures
_PME.prototype.asignBase = function(res) {
    const type = res.spineData && "spineSheet" || res.data.animations && "animationSheet" || "tileSheet";
    const tmpData = this._tmpData[res.name];
    if(type==="spineSheet"){ // type spineSheet;
        Object.defineProperty(tmpData, "baseTextures", { value: [], writable:true }); // only for editor
        Object.defineProperty(tmpData, "spineData", { value: {}, writable:true });
        Object.defineProperty(tmpData, "data", { value: {}, writable:true });
        Object.defineProperty(tmpData, "perma", { value: $Loader._permaName.contains(res.name) });
        Object.defineProperty(tmpData, "type", { value: "spineSheet"});
        Object.defineProperty(tmpData, "normal", { value: false, writable:true}); // TODO: need scan skin

        return type;
    };
    if(type==="animationSheet" || type==="tileSheet"){
        Object.defineProperty(tmpData, "baseTextures", {value: [], writable:true }); // only for editor
        Object.defineProperty(tmpData, "textures", { value: {} ,writable:true });
        Object.defineProperty(tmpData, "textures_n", { value: {} ,writable:true });
        Object.defineProperty(tmpData, "data", { value: {}, writable:true });
        Object.defineProperty(tmpData, "perma", { value: $Loader._permaName.contains(res.name) });
        Object.defineProperty(tmpData, "type", { value: type});
        Object.defineProperty(tmpData, "normal", { value: false, writable:true});
        return type;
    };
    return console.error("WARNING, can not find type of packages sheets! Missing meta:",res)
};

// create Normal Textures
_PME.prototype.computeNormal = function() {
    for (const key in this._tmpRes_normal) {
        const res = this._tmpRes_normal[key];
        const baseTexture = res.texture.baseTexture;
        const textures_n = {};
        for (const texName in  res.FROM.textures) {
            const tex = res.FROM.textures[texName];
            const orig = tex.orig.clone();
            const frame = tex._frame.clone();
            const trim = tex.trim && tex.trim.clone();
            const rot = tex._rotate;
            const texture = new PIXI.Texture(baseTexture, frame, orig, trim, rot); // (this.baseTexture, this.frame, this.orig, this.trim, this.rotate
            texture.textureCacheIds = [texName];
            textures_n[`${texName}_n`] = texture;
        }
        res.FROM.textures_n = textures_n;
    };
    delete this._tmpRes_normal;
};

// assign multiPack data to FROM original data
_PME.prototype.computeMultiPack = function() {
    for (const key in this._tmpRes_multiPack) {
        const ress = this._tmpRes_multiPack[key];

        const textures = ress.textures;
        const origin_textures = ress.FROM.textures;
        Object.assign(origin_textures, textures);

        const textures_n = ress.textures_n;
        const origin_textures_n = ress.FROM.textures_n;
        Object.assign(origin_textures_n, textures_n);

        // DATA
        const frames = ress.data.frames;
        const origin_frames = ress.FROM.data.frames;
        Object.assign(origin_frames, frames);

        const animations = ress.data.animations;
        const origin_animations = ress.FROM.data.animations;
        for (const key in animations) {
            const ani = animations[key];
            origin_animations[key].push(...ani);
        };

        ress.FROM.children.push(ress.children[0]) // add baseTexture for editor only
    };
    delete this._tmpRes_multiPack;
};

_PME.prototype.computeData = function() {
    for (const key in this._tmpData) {
        const tmpData = this._tmpData[key];
        const tmpRes = this._tmpRes[key];

        if(tmpData.type === "spineSheet"){
            Object.assign(tmpData.data, tmpRes.data);
            Object.assign(tmpData.spineData, tmpRes.spineData);
        };

        if(tmpData.type ==="tileSheet"){
            Object.assign(tmpData.data, tmpRes.data);
            Object.assign(tmpData.textures, tmpRes.textures);
            Object.assign(tmpData.textures_n, tmpRes.textures_n);
            tmpData.normal = !!tmpData.data.meta.normal_map; 
        };

        if(tmpData.type ==="animationSheet"){
            Object.assign(tmpData.data, tmpRes.data);
            tmpData.normal = !!tmpData.data.meta.normal_map;
            for (const key in tmpRes.data.animations) {
                tmpData.textures[key] = [];
                tmpData.textures_n[key] = [];
                const keyList = tmpRes.data.animations[key];
                keyList.sort().forEach(keyAni => {
                    const ani = tmpRes.textures[keyAni];
                    const ani_n = tmpRes.textures_n[keyAni+"_n"];
                    tmpData.textures[key].push(ani);
                    tmpData.textures_n[key].push(ani_n);
                });
            };
        };

        // for editor only: create thumbs baseTextures sheets preview
        tmpRes.children.forEach(ressource => {
            if(ressource.extension.contains("png")){
                tmpData.baseTextures.push(PIXI.Texture.from(ressource.data));
            };
        });
    };
    this.Data2 = Object.assign({}, this._tmpData);
    delete this._tmpData;
    delete this._tmpRes;
};

 _PME.prototype.startGui = function() {
    // scene hack
    const scene = SceneManager._scene;
    scene.CAGE_EDITOR = new PIXI.Container();
    scene.CAGE_EDITOR.name = "CAGE_GUI";
    scene.addChildAt(SceneManager._scene.CAGE_EDITOR, scene.children.length-1);

    const cage = new PIXI.Container();
    const spine = new PIXI.spine.Spine(this.editor.editorGui);
    scene.CAGE_EDITOR.addChild(spine);
    this.editorGui = spine;

    spine.autoUpdate = true;
    spine.state.setAnimation(0, 'idle', true);
    spine.state.setAnimation(1, 'start0', false);
    spine.state.tracks[1].listener = {
        complete: function(trackEntry, count) {
            iziToast.hide({transitionOut: 'fadeOutUp'}, document.getElementById("izit_loading1") );
            iziToast.warning( $PME.izit_loading1() );
            $PME.startEditor();
        }
    };
 };


// ┌------------------------------------------------------------------------------┐
// END START INITIALISE PLUGIN METHOD** ↑↑↑
// └------------------------------------------------------------------------------┘


 // Start The Editor initialisation SCOPE
_PME.prototype.startEditor = function() {
    console.log1('__________________startEditor:__________________ ');
    //#region [rgba(200, 0, 0,0.1)]
    // ┌------------------------------------------------------------------------------┐
    // Start The Editor initialisation SCOPE
    // └------------------------------------------------------------------------------┘
    const CACHETILESSORT = {}; //CACHE FOR PATHFINDING ONCE
    const REGISTER = []; // REGISTER OBJET ON MAPS, ADDED WITH EDITOR SESSIONS
    const FILTERS = {
        OutlineFilterx4: new PIXI.filters.OutlineFilter (4, 0x000000, 1),
        OutlineFilterx16: new PIXI.filters.OutlineFilter (16, 0x000000, 1),
    }
    const STAGE = SceneManager._scene; 
    const DATA = this.Data2;
    const EDITOR = this.editorGui;
    const Renderer = Graphics._renderer; // ref to current renderer RMMV Graphics
    let ButtonsSlots = []; // store spine buttons
    let InMask = null;
    let InLibs = null;
    let InTiles = null;
    let InMapObj = null;
    let mX = 0, mY = 0; // mosue screen
    let mMX = 0, mMY = 0; // mouse map 
    // scoller 
    let scrollAllowed = true;
    let ScrollX = 0;
    let ScrollY = 0;
    let ScrollF = 0.1; // _displayXY power for scroll map
    let scrollSpeed = 20;
    // zoom 
    const Zoom = STAGE.CAGE_MAP.scale;
    const MemCoorZoom1 = new PIXI.Point(), MemCoorZoom2 = new PIXI.Point(); // for control zoom memory
 
// TODO: ENLEVER LES JAMBRE ET LES PIED DES PERSONNAGTE. POUR FAIRE DES BOULE SAUTILLANTE.
// SEULEMENT CHEZ LES ANIMAUX SEULEMENT , IL SEMBLERAI AVOIR 2 ESPECE DIFERENTE.
// DES ANIMAUX A BOULE
// DES ANIMAUX A BOULE COMME LE CHAT, SUR LA TETE.

    //#endregion

//#region [rgba(250, 0, 0,0.03)]
// ┌------------------------------------------------------------------------------┐
// SETUP VARIABLE AND AUTO FUNCTION SCOPED (ONCE)
// └------------------------------------------------------------------------------┘
// CAGE_LIBRARY ________________
const CAGE_LIBRARY = new PIXI.Container(); // Store all avaibles libary
    CAGE_LIBRARY.mask = new PIXI.Sprite(PIXI.Texture.WHITE); //Mask for scroll bottom libs
    CAGE_LIBRARY.addChild(CAGE_LIBRARY.mask);
    CAGE_LIBRARY.list = []; // store liste of current obj cages elements
    // setup && hack
    CAGE_LIBRARY.position.set(115,950);
    CAGE_LIBRARY.mask.position.set(-8,-8); // marge outline filters
    CAGE_LIBRARY.mask.width = 1740, CAGE_LIBRARY.mask.height = 220;
    CAGE_LIBRARY.mask.getBounds();
    // reference
    CAGE_LIBRARY.name = "library";
    STAGE.CAGE_EDITOR.addChild(CAGE_LIBRARY);
// CAGE_TILESHEETS ________________
const CAGE_TILESHEETS = new PIXI.Container(); // Store all avaibles libary
    CAGE_TILESHEETS.mask = new PIXI.Sprite(PIXI.Texture.WHITE); //Mask for scroll bottom libs
    CAGE_TILESHEETS.addChild(CAGE_TILESHEETS.mask);
    // setup && hack
    CAGE_TILESHEETS.position.set(1280,50);
    CAGE_TILESHEETS.mask.position.set(-8,-8); // marge outline filters
    CAGE_TILESHEETS.mask.width = 1000, CAGE_TILESHEETS.mask.height = 1000;
    CAGE_TILESHEETS.mask.getBounds();
    CAGE_TILESHEETS.open = false;
    CAGE_TILESHEETS.list = false; // store list of tile
    // reference
    STAGE.CAGE_EDITOR.addChild(CAGE_TILESHEETS);
// CAGE_MOUSE ________________
const CAGE_MOUSE = STAGE.CAGE_MOUSE // Store all avaibles libary
    CAGE_MOUSE.previews = new PIXI.Container(); // store preview list
    CAGE_MOUSE.previewsShowed = false;
    CAGE_MOUSE.currentSprite = null;
    CAGE_MOUSE.list = false; // store list array of current objs hold by the mouse
    CAGE_MOUSE.addChild(CAGE_MOUSE.previews);
// CAGE_MAP ________________
const CAGE_MAP = STAGE.CAGE_MAP; // Store all avaibles libary


//#endregion

// ┌------------------------------------------------------------------------------┐
// SETUP create thumbail library AUTO
// └------------------------------------------------------------------------------┘
     // createLibraryObj sheets for thumbails libs
     (function(){
        let x = 100;
        for (const key in DATA) { // this._avaibleData === DATA
            const data = DATA[key];
            const cage = create_FromData(data,"thumbs"); // create from Data ""
            CAGE_LIBRARY.list.push(cage);
        };
        refreshLibs();
    })();

    // createButtons from spine Editor
    (function(){ // make and store buttons Data'slots
        const list = this.editorGui.spineData.slots;
        for (let i = 0, l = list.length; i < l; i++) {
            const slot = list[i];
            const boneName = slot.boneData.name;
            if(boneName.contains("icon_")){
                const _slot = this.editorGui.skeleton.findSlot(slot.name);
                ButtonsSlots.push(_slot);
                _slot.name = slot.name;
                _slot._boundsRect = _slot.currentSprite.getBounds();
            };
    };
    //force select layer button 
    //update_DisplayGroup(1);
    }).bind(this)();

    //#region [rgba(10, 80, 10,0.08)]
    // ┌------------------------------------------------------------------------------┐
    // METHOD SCOPED FOR EDITOR ONLY (POLYFILL) UTILITY
    // └------------------------------------------------------------------------------┘
    // get ran hexa color
    function hexColors() { 
        return ('0x' + Math.floor(Math.random() * 16777215).toString(16) || 0xffffff);
    };

    // check colition from _boundsMap
    function hitCheck(a, b){ // colision
        var ab = a._boundsMap._pad
        var bb = b._boundsMap
        return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
    };

    // draw a grafics lines
    function drawLine(sXY,eXY,l,c,a){
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(l||2, c||0xffffff, a||1);
        return graphics.moveTo(sXY[0],sXY[1]).lineTo(eXY[0], eXY[1]).endFill();
    };

    // scene mouse update
    function update_Light() {
        STAGE.light_sunScreen.x =  mX, STAGE.light_sunScreen.y = mY;
    };

    // Get a ratio for resize in a bounds
    function getRatio(obj, w, h) {
        let r = Math.min(w / obj.width, h / obj.height);
        return r;
    };

    function hitCheck(a, b){ // colision
        var ab = a._boundsRect;
        var bb = b._boundsRect;
        return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
    };

    function drawGrids(){
        const eX = 1920; // map width + zoom
        const eY = 1080; // map width + zoom
        const maxLineH = eX/48, maxLineV = eY/48;
        const fWH = 48; // factor squares width heigth
        const color = [0xffffff,0x000000,0xff0000,0x0000ff][~~(Math.random()*4)];
        const rt = PIXI.RenderTexture.create(eX, eY); // create frame for hold rendered grafics
        const rc_grid = new PIXI.Container();
        function draw(sX,sY,eX,eY){
            const graphics = new PIXI.Graphics();
            graphics.lineStyle(2, color, 0.5);
            return graphics.moveTo(sX,sY).lineTo(eX, eY).endFill();
        }
        for (let l=0, y=0; l < maxLineV; l++, y=l*fWH) {
            rc_grid.addChild(draw(0,y,eX,y));
        };
        for (let l=0, x=0; l < maxLineH; l++, x=l*fWH) {
            rc_grid.addChild(draw(x,0,x,eY));
        };
        // finish to add all grid line in rc_grid. generate a texture of the rc_grid
        Renderer.render(rc_grid, rt);
        const sprite = PIXI.Sprite.from(rt);
        sprite.alpha = 0.5;
        STAGE.CAGE_MAP.addChild(sprite);
    };

    //#endregion

    //#region [rgba(0, 140, 0,0.08)]
    // ┌------------------------------------------------------------------------------┐
    // METHOD ACCEST SCOPED FOR EDITOR
    // └------------------------------------------------------------------------------┘
    // REFRESH DE BASE LIBS
    function refreshLibs(){
        // refresh libs bound , positions and filters
        CAGE_LIBRARY.list.forEach(cage => {
                CAGE_LIBRARY.removeChild(cage);
        });
        // filters TODO:
        // sorts TODO:
        const maxX = CAGE_LIBRARY.mask.width;
        const maskH = CAGE_LIBRARY.mask.height;
        for (let i=x=y=line= 0, disX = 25, l = CAGE_LIBRARY.list.length; i < l; i++) {
            const cage = CAGE_LIBRARY.list[i];
            if(cage.renderable){
                if(cage.x+cage.width>maxX){ x=0, y+=maskH};
                cage.x = +x;
                cage.y = +y;
                x+=cage.width+disX;
                CAGE_LIBRARY.addChild(cage);
                cage.getBounds();
            };
        };
    };

    // build a sheets objList with pathFinding => [vertical to horizontal]
    function pathFindSheet(list, yMax, pad) {
        const tmp_list = []; // new list
        let antiFreeze = 500000;
        refresh = function(cage,x,y){
            cage.position.set(x,y);
            cage.getBounds();
            //cage.DebugElements.bg.getBounds();
        };
        for (let I = 0, L = list.length; I < L; I++) {
            const cage = list[I];
            let x = +pad, y = +pad;
            let contact = false;
            // scan, no collid with alrealy added cage
            for (let i = 0, l = tmp_list.length; i < l; i++) {
                const temp = tmp_list[i];
                const bH = cage._boundsRect.height;
                refresh(cage,x,y);
                contact = hitCheck(cage,temp);
                if(contact){
                    i = -1;
                    if(y+pad+bH>yMax){
                        y = +pad, x+=pad;
                    }else{
                        y+=pad;
                    };
                };
                if(!antiFreeze--){return console.error("error:antiFreeze") }
            };
            // no contact, add to current point
            tmp_list.push(cage);
            CACHETILESSORT[cage.Sprites.groupName][cage.Sprites.groupTexureName] = new PIXI.Point(x,y); //REGISTER
            refresh(cage,x,y);
            cage._boundsRect.pad(pad,pad);
            //cage.DebugElements.bg._boundsRect.pad(pad,pad);
        };
    };



//#endregion

    //#region [rgba(219, 182, 2, 0.05)]
    // ┌------------------------------------------------------------------------------┐
    // IZITOAST DATA EDITOR 
    // └------------------------------------------------------------------------------┘
    // create multi sliders light
    function create_sliderFalloff(){
        const kc = new Slider("#kc", {  step: 0.01,value:0, min: 0.01, max: 1, tooltip: false });
        kc.tooltip.style.opacity = 0.5;

        const kl = new Slider("#kl", {step: 0.1,value:0, min: 0.1, max: 20, tooltip: 'always'});
        kl.tooltip.style.opacity = 0.5;

        const kq = new Slider("#kq", {step: 0.01,value:0, min: 0.1, max: 50, tooltip: 'always'});
        kq.tooltip.style.opacity = 0.5;
        return {kc:kc,kl:kl,kq:kq};
    };

    function open_mapSetupEditor() {
        iziToast.opened = true;
        document.exitPointerLock();
        iziToast.info( $PME.mapSetupEditor() );
        // show tint colors pickers
        const _jscolor = new jscolor(document.getElementById("color")); // for case:id="_color" slider:id="color"
        _jscolor.zIndex = 9999999;
        const _Falloff = create_sliderFalloff(); // create slider html for pixiHaven
        start_mapSetupEditor(_jscolor,_Falloff);
    };

    // for scene setup
    function start_mapSetupEditor(_jscolor,_Falloff){
        const dataIntepretor = document.getElementById("dataIntepretor"); // current Data html box
        let dataFromID = { 
      
        };
        let checkBoxID = { // store checkBox id and data
      
        };
        let optionsFromID = { // no props, special options case
      
        };

        
        //STEP1: GET NATIVE DATA and store in tmp_DataByID
        //STEP2: REFRESH HTML WITH NATIVE DATA"
        //STEP3: CHANGE CURRENT DATA WITH LISTENER"
        // ========= DATA LISTENER  ===========
        // when checkBox changes
        dataIntepretor.onchange = function(event){
    
        };
        dataIntepretor.oninput = function(event){ 
            const e = event.target;
            if(!e.id.contains("_")){
                dataFromID[e.id] = e.value;
            };
            if(e.id.contains("_")){
                const e = event.target;
                checkBoxID[e.id] = e.checked;
            };
            refreshWithData(dataFromID,checkBoxID);
        };

        // ========= control global scene light ===========
        // JSCOLOR, when change color from color Box
        _jscolor.onFineChange = function(){
            const key = Cage_DataEditor.jsColor.keyName;
            document.getElementById(`_${key}`).checked = true; // force check case
            refreshSessionWith_html(session);
            const _reelZoom = document.getElementById('reelZoom').checked;
            refreshSpriteWith_session(objSprite,session,[_reelZoom]);
        };
        // Bootstrape sliders, when change value
        _Falloff.kc.on("slide", function(value) {
            refreshSessionWith_html(session,"falloff", value, 0);
            refreshSpriteWith_session(objSprite,session,[_reelZoom]);
        });
        _Falloff.kl.on("slide", function(value) {
            refreshSessionWith_html(session,"falloff", value, 1);
            refreshSpriteWith_session(objSprite,session,[_reelZoom]);
            
        });
        _Falloff.kq.on("slide", function(value) {
            refreshSessionWith_html(session,"falloff", value, 2);
            refreshSpriteWith_session(objSprite,session,[_reelZoom]);
        });
    };


    function refreshWithData(dataFromID,checkBoxID) {
        console.log('dataFromID,checkBoxID: ', dataFromID,checkBoxID);
        for (const key in dataFromID) {
            const value = dataFromID[key];
            const checked = !!checkBoxID[`_${key}`];
            if(key==="BackGround"){
                if(checked && value){
                    if(STAGE.Background){
                        STAGE.CAGE_MAP.removeChild(STAGE.Background);
                        STAGE.Background = null;
                    };
                    STAGE.createBackground(DATA[value]);
                    STAGE.Background.Data = DATA[value];

                }else{
                    if(STAGE.Background){
                        STAGE.CAGE_MAP.removeChild(STAGE.Background);
                        STAGE.Background = null;
                    };
                }
            }
        }
    }


//#endregion

    //#region [rgba(40, 5, 50,0.2)]
    // ┌------------------------------------------------------------------------------┐
    // METHOD CREATE CAGE OBJECT SPRITES 
    // └------------------------------------------------------------------------------┘
    // build previews sprites
    function create_Previews(textures){
        const list = [];
        let totalWidth = 0;
        for (let i = 0, l = textures.length; i < l; i++) { // build the preview sheets
            const sprite = new PIXI.Sprite(textures[i]);
            sprite.scale.set( getRatio(sprite, 350, 350) );
            sprite.anchor.y = 1;
            sprite.x = totalWidth;
            totalWidth+=sprite.width;
            list.push(sprite);
        };
        return list;
    };

    function create_IconsFilters(type,data){
        const cage = new PIXI.Container();
        const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
        const filtersID = []; // when we filtering by ID
        let y = 0;
        function addIconFrom(filePNG,id){
            const texture = new PIXI.Texture.fromImage(`editor/images/${filePNG}`);
            const sprite = new PIXI.Sprite(texture);
            sprite.y = +y;
            y+=30;
            cage.addChild(sprite);
            filtersID.push(id);
        };
        if(data.type === "tileSheet"){ addIconFrom('filter_texturePacker.png'),0 };
        if(data.type === "animationSheet"){ addIconFrom('filter_animation.png'),1 };
        if(data.type === "spineSheet"){ addIconFrom('filter_spine.png'),2 };
        if(data.normal){ addIconFrom('filter_normal.png'),3 };
        if(data.name.contains("-0")){ addIconFrom('info_multiPack.png'),4 };
        cage.addChildAt(bg,0);
        cage.filtersID = filtersID;
        cage.bg = bg;
        bg.tint = 0x000000;
        bg.alpha = 0.5;
        bg.width = 30;
        bg.height = y;
        return cage;
    };

    // TODO: asign props froms Html Editor and also add basic data from tileSheets sleector : anchor, ansimation (ctrl + "+")
    function setup_dataJson(type,data,sprites,debug,useNormal){
   
    };


    function setup_LayerGroup(type,data,sprites,debug,useNormal){
        if(useNormal && type === "spineSheet"){
            //Spine.prototype.convertToNormal () TODO:
            return;
        };
        if(useNormal){
            sprites.d && (sprites.d.parentGroup = PIXI.lights.diffuseGroup);
            sprites.n && (sprites.n.parentGroup = PIXI.lights.normalGroup);
            debug.bg.parentGroup = PIXI.lights.diffuseGroup;
            this.parentGroup = $displayGroup.group[1]; //TODO: CURRENT
            this.zIndex = mMY;
        };
    };

    function setup_Parenting(type,data,sprites,debug,useNormal){
        if(type === "thumbs"){
            this.addChild(debug.bg, sprites.t, debug.icons);
        };
        if(type === "tileSheet"){
            this.addChild(debug.bg, sprites.d, debug.an);
            if(useNormal && sprites.n){ this.addChildAt(sprites.n,2) }; 
            if(!useNormal && sprites.n){ this.addChildAt(sprites.n,1) }; // show below, when mouse hover, just renderable preview n
        };
        if(type === "animationSheet"){
            this.addChild(debug.bg, sprites.d, debug.an);
            if(useNormal && sprites.n){ this.addChildAt(sprites.n,2) }; 
            if(!useNormal && sprites.n){ this.addChildAt(sprites.n,1) }; // show below, when mouse hover, just renderable preview n
        };
        if(type === "spineSheet"){
            cage.addChild(DebugElements.bg, sprites.s, DebugElements.an);
            //getBoundsMap(cage);
            cage.getBounds();
            //cage.DebugElements.bg.getBounds();
        };
    };

    // pass all references for build
    function setup_Reference(type,data,sprites,debug,useNormal){
            this.name = data.name;
            this.Type = type;
            this.Sprites = sprites; //  {d:(diffuse sprite), n:(normal sprite), s:(spine sprite), t:(tumb sprite), p:(preview sprites)}
            this.DebugElements = debug;
            this.Data = data;
    };

    // set default proprety
    function setup_Proprety(type,data,sprites,debug,useNormal){
        if(type === "thumbs"){
        };
        if(type === "tileSheet"){
            //TODO: A BESOIN DE L'OBJECT OLD COPY pour prend les informations, essayer de fusionner le system
            debug.bg.anchor.set(0,0); // TODO: from tilesObj
            debug.bg.width = sprites.d.width;
            debug.bg.height =  sprites.d.height;
            debug.an.tint = 0xee5000;
            debug.bg.tint = useNormal && 0x000000 || 0xffffff;
            debug.an.width = 24, debug.an.height = 24;
            debug.an.anchor.set(0.5,0.5);
            if(sprites.n && !useNormal){ // hide normal for tileSheets use:"ctrl+n" for swape renderable
                sprites.n.renderable = false;
            };
        };
        if(type === "animationSheet"){
            debug.bg.anchor.set(0,0); // TODO: from tilesObj
            debug.bg.width = sprites.d.width;
            debug.bg.height =  sprites.d.height;
            debug.an.tint = 0xee5000;
            debug.bg.tint = useNormal && 0x000000 || 0xffffff;
            debug.an.width = 24, debug.an.height = 24;
            debug.an.anchor.set(0.5,0.5);
            sprites.d.normalWith(sprites.n, data.textures_n[sprites.groupTexureName]);
            sprites.d.gotoAndPlay(0);
            if(sprites.n && !useNormal){ // hide normal for tileSheets use:"ctrl+n" for swape renderable
                sprites.n.renderable = false;
            };
        };
        if(type === "spineSheet"){
            useNormal && (cage.x = mMX, cage.y = mMY);
            const skinName = textureName;
            sprites.s.skeleton.setSkinByName(skinName);
            sprites.s.state.setAnimation(0, data.animations[0], true); // alway use base animations idle..
            sprites.s.skeleton.setSlotsToSetupPose();
            DebugElements.bg.anchor.set(0.5,1);
        };

    };

    function create_DebugElements(type,data,sprites){
        if(type === "thumbs"){
            const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
            const previews = create_Previews(data.baseTextures); // sprites preview reference;
            const icons = create_IconsFilters(type,data); // icons
            icons.x = sprites.t.width;
            bg.width = sprites.t.width + icons.width;
            bg.height =  Math.max(sprites.t.height, icons.height);
            bg.getBounds();
            return {bg:bg, previews:previews, icons:icons};
        };
        if(["tileSheet","animationSheet"].contains(type)){
            const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
            const anchorPoint = new PIXI.Sprite(PIXI.Texture.WHITE);
            return {bg:bg, an:anchorPoint}; 
        };
        if(type === "spineSheet"){
            const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
            const anchorPoint = new PIXI.Sprite(PIXI.Texture.WHITE);
            anchorPoint.tint = 0xee5000;
            anchorPoint.width = 24, anchorPoint.height = 24;
            anchorPoint.anchor.set(0.5,0.5);
            bg.width = sprites.s.width; // TODO:  from zoomer
            bg.height =  sprites.s.height;
            bg.getBounds(); // for help anchorPoint
            return {bg:bg, an:anchorPoint}; 
        };
    };

    // create sprites elements
    function create_Sprites(type,data,name){
        if(type === "thumbs"){
            const sprite = new PIXI.Sprite(data.baseTextures[0]); // take first tex for thumbs, preview will take all array
                sprite.scale.set( getRatio(sprite, 134, 100) ); //ratio for fitt in (obj, w, h)
            return {t:sprite}; // {d:(diffuse sprite), n:(normal sprite), s:(spine sprite), t:(tumb sprite), p:(preview sprites)} 
        };
        if(type === "tileSheet"){
            const sprite_d = new PIXI.Sprite(data.textures[name]); // take first tex for thumbs, preview will take all array
            const sprite_n = data.textures_n[`${name}_n`] && new PIXI.Sprite(data.textures_n[`${name}_n`]) || false; // allow swap texture hover tile
            return {d:sprite_d, n:sprite_n, groupName:data.name, groupType:type, groupTexureName:name}; // {d:(diffuse sprite), n:(normal sprite), s:(spine sprite), t:(tumb sprite), p:(preview sprites)} 
        };
        if(type === "animationSheet"){
            const sprite_d = new PIXI.extras.AnimatedSprite(data.textures[name]);
            const sprite_n =  data.textures_n[name] && new PIXI.Sprite(data.textures_n[name][0]); // use firse texture
            return {d:sprite_d, n:sprite_n, groupName:data.name, groupType:type, groupTexureName:name}; // {d:(diffuse sprite), n:(normal sprite), s:(spine sprite), t:(tumb sprite), p:(preview sprites)} 
        };
        if(type === "spineSheet"){
            const skinName = textureName; // use texturesName to spine skin name
            const spine = new PIXI.spine.Spine(data.spineData);
            return {s:spine}; // {d:(diffuse sprite), n:(normal sprite), s:(spine sprite), t:(tumb sprite), p:(preview sprites)} 
        };
    };

    function create_FromData(data){
        const cage = new PIXI.Container();
        const sprites = create_Sprites("thumbs",data);// return {d:(diffuse sprite), n:(normal sprite), s:(spine sprite), *t:(tumb sprite), p:(preview sprites)} 
        const debug = create_DebugElements("thumbs",data, sprites);
        setup_Proprety.call(cage,"thumbs",data,sprites,debug);
        setup_Reference.call(cage,"thumbs",data,sprites,debug);
        setup_Parenting.call(cage, "thumbs", data, sprites, debug);
        cage.getBounds();
        cage.DebugElements.bg.getBounds();
        return cage;
    };


    // create tiles from type with texture name
    function create_FromLibrary(data,name){
        const cage = new PIXI.Container();// store {d:(diffuse sprite), n:(normal sprite), s:(spine sprite), t:(tumb sprite), p:(preview sprites)}
        const type = data.type;
        const sprites = create_Sprites(type, data, name);
        const debug = create_DebugElements(type, data, sprites);
        setup_Reference.call(cage ,type, data, sprites, debug);
        setup_Proprety.call(cage, type, data, sprites, debug);
        setup_Parenting.call(cage, type, data, sprites, debug);
        setup_LayerGroup.call(cage, type, data, sprites, debug);
        cage.getBounds();
        cage.DebugElements.bg.getBounds();
        return cage;
    };

    // create obj for mouse with current data setup from 
    function create_FromTileSheet(data,name){
        const cage = new PIXI.Container();// store {d:(diffuse sprite), n:(normal sprite), s:(spine sprite), t:(tumb sprite), p:(preview sprites)}
        const type = data.meta.type;
        const useNormal = true;
        const sprites = create_Sprites(type, data, name);
        const debug = create_DebugElements(type, data, sprites);
        setup_Reference.call(cage ,type, data, sprites, debug);
        setup_Proprety.call(cage, type, data, sprites, debug, useNormal);
        setup_Parenting.call(cage, type, data, sprites, debug, useNormal);
        setup_LayerGroup.call(cage, type, data, sprites, debug, useNormal);
        cage.getBounds();
        cage.DebugElements.bg.getBounds();
        return cage;
    };
 

//#endregion

//#region [rgba(1, 20, 40,0.2)]
// ┌------------------------------------------------------------------------------┐
// CHECK INTERACTION MOUSE
// └------------------------------------------------------------------------------┘

    function show_tileSheet(InLibs) {
        console.log('InLibs: ', InLibs);
        // check if alrealy opened ???  open_tileSheet // return hide
        if(check_tileSheetStatus(CAGE_TILESHEETS,InLibs)){return}; 
        // create tiles from a LIST ARRAY for the tilesBox
        const list = [];
        const type = InLibs.Data.type;
        if(["tileSheet","animationSheet"].contains(type) ){
            Object.keys(InLibs.Data.textures).forEach(texName => {
                list.push(create_FromLibrary(InLibs.Data, texName));
            });
        };
        if(type === "spineSheet"){ // special case
            data.skins.forEach(skin => {
                list.push(create_CagefromType(type,data,skin));
            });
        };
        CAGE_TILESHEETS.list = list;
        CAGE_TILESHEETS.addChild(...list);
        console.log('list[0]: ', list[0].Sprites.groupName);
   
        // if cache not registered, compute path or copy value from cache.
      

        if(!CACHETILESSORT[InLibs.Data.name]){
            CACHETILESSORT[InLibs.Data.name] = {};
            pathFindSheet(list,1000,15);
        }else{ // alrealy exist caches positions
            list.forEach(cage => {
                cage.position.copy( CACHETILESSORT[cage.Sprites.groupName][cage.Sprites.groupTexureName] ); 
                cage.getBounds();
                cage.DebugElements.bg.getBounds();
            });
        };
    };

    function check_tileSheetStatus(CAGE_TILESHEETS,InLibs) {
        // if open, and same name or diff name, hide or clear
        if(CAGE_TILESHEETS.name === InLibs.name){ return clear_tileSheet(true,CAGE_TILESHEETS,InLibs) };
        if(CAGE_TILESHEETS.name !== InLibs.name){ return clear_tileSheet(false,CAGE_TILESHEETS,InLibs) };
    };

    function clear_tileSheet(hide,CAGE_TILESHEETS,InLibs) {
        // remove all, but keep the mask as child[0]
        if(hide){
            CAGE_TILESHEETS.open = false;
            CAGE_TILESHEETS.name = null;
            EDITOR.state.setAnimation(2, 'hideTileSheets', false);
        }else{
            !CAGE_TILESHEETS.open && EDITOR.state.setAnimation(2, 'showTileSheets', false);
            CAGE_TILESHEETS.name = InLibs.name;
            CAGE_TILESHEETS.open = true;
        }
        // reset clear
        CAGE_TILESHEETS.children.splice(1, CAGE_TILESHEETS.children.length);
        PIXI.utils.clearTextureCache();
        return hide;
    };

    function add_toMouse(InTiles) {
        const cage = create_FromTileSheet(InTiles.Data, InTiles.Sprites.groupTexureName);
        cage.Sprites.d && cage.Sprites.d.anchor.set(InTiles.DebugElements.an.anchorValue.x,InTiles.DebugElements.an.anchorValue.y);
        cage.Sprites.n && cage.Sprites.n.anchor.set(InTiles.DebugElements.an.anchorValue.x,InTiles.DebugElements.an.anchorValue.y);
        cage.DebugElements.bg.anchor.set(InTiles.DebugElements.an.anchorValue.x,InTiles.DebugElements.an.anchorValue.y);
  
        CAGE_MAP.addChild(cage);
        CAGE_MOUSE.list = cage;
    };

    // add to map new obj + Obj.Asign a copy unique of html Editor json asigned
    function add_toScene(obj) {
        const cage = create_FromTileSheet(obj.Data, obj.Sprites.groupTexureName);
        cage.Sprites.d && cage.Sprites.d.anchor.copy(obj.Sprites.d.anchor);
        cage.Sprites.n && cage.Sprites.n.anchor.copy(obj.Sprites.n.anchor);
        cage.DebugElements.bg.anchor.copy(obj.DebugElements.bg.anchor);
        cage.x = mMX;
        cage.y = mMY;
        CAGE_MAP.addChild(cage);
        CAGE_MAP.list = cage;
        cage.getBounds();
        //getBoundsMap(cage); // with camera factor
        REGISTER.push(cage);
    };

    function execute_buttons(InButtons) {
        console.log('InButtons: ', InButtons);
        if(InButtons.currentSpriteName.contains("icon_setup")){
            EDITOR.state.setAnimation(2, 'filterSetting', false);
        }
        if(InButtons.currentSpriteName.contains("icon_grid")){
            drawGrids();
        };
        if(InButtons.currentSpriteName.contains("icon_masterLight")){
            //open_dataEditor();
            open_mapSetupEditor(); // edit ligth brigth , and custom BG
        };
    };

//#endregion

//#region [rgba(0, 0, 0,0.3)]
// ┌------------------------------------------------------------------------------┐
// CHECK INTERACTION MOUSE
// └------------------------------------------------------------------------------┘
    // mX,mY: mouse Position
    function show_previews(cage) {
        if(cage && !CAGE_MOUSE.previewsShowed){
            CAGE_MOUSE.previews.addChild(...cage.DebugElements.previews);
            CAGE_MOUSE.previewsShowed  = true;
        }
        if(!cage && CAGE_MOUSE.previewsShowed){
            CAGE_MOUSE.previews.removeChildren();
            CAGE_MOUSE.previewsShowed = false;
        };
    };

    // mX,mY: mouse Position
    function checkAnchor(cage) {
        let b = cage.DebugElements.bg._boundsRect;
        let vec4H = b.width/4;
        let vec4V = b.height/4;
        let vec3H = [0, b.width/2, b.width];
        let vec3V = [0, b.height/2, b.height];
        let inX = mX - (b.x);
        let inY = mY - (b.y);
        let x,y;
        if(inX>vec4H*3){ x = vec3H[2] };
        if(inX<vec4H*3){ x = vec3H[1] };
        if(inX<vec4H*1){ x = vec3H[0] };
        if(inY>vec4V*3){ y = vec3V[2] };
        if(inY<vec4V*3){ y = vec3V[1] };
        if(inY<vec4V*1){ y = vec3V[0] };
        cage.DebugElements.an.position.set(x,y);
        cage.DebugElements.an.anchorValue = {x:x/b.width,y:y/b.height}; // for anchor when copy to map
   
    };

    function activeFilters(cage){
        if(cage.bone){ // is a buttons
            const sprite =  cage.currentSprite;
            sprite._filters = [ FILTERS.OutlineFilterx4 ]; // thickness, color, quality
            sprite.scale.set(1.2,-1.2);
            cage.color.a = 1;
        }else{
            const sprite =  cage.Sprites.t ||  cage.Sprites.d ||  cage.Sprites.s;
            sprite._filters = [ FILTERS.OutlineFilterx4 ]; // thickness, color, quality
            cage._filters = [ FILTERS.OutlineFilterx16 ];
            cage.DebugElements.bg._filters = [ FILTERS.OutlineFilterx16 ];
            cage.alpha = 1;
        };
 
    };

    function clearFilters(list,index){
        let _list = Number.isFinite(index) && list.slice() || false;
        _list && _list.splice(index,1) || (_list = list); // index allow jump the active cage
        for (let i = 0, l = _list.length; i < l; i++) {
            const cage = _list[i];
            if(cage.bone){ // is a buttons
                const sprite =  cage.currentSprite;
                sprite._filters = null; // thickness, color, quality
                sprite.scale.set(1,-1);
                cage.color.a = 0.7;
            }else{
                const sprite =  cage.Sprites.t ||  cage.Sprites.d ||  cage.Sprites.s;
                sprite._filters = null; // thickness, color, quality
                cage.DebugElements.bg._filters = null;
                cage.alpha = 0.85;
            };
        };
    };

    function check_InMask(mX,mY) {
        let inValue = false;
        if(CAGE_LIBRARY.mask._boundsRect.contains(mX,mY)){ inValue= "CAGE_LIBRARY" };
        if(CAGE_TILESHEETS.mask._boundsRect.contains(mX,mY)){ inValue= "CAGE_TILESHEETS" };
        if(!inValue && !!(InLibs || InTiles)){
           clearFilters(InLibs && CAGE_LIBRARY.list || InTiles && CAGE_TILESHEETS.list);
        };
        return inValue;
    };

    // scan and test bound for check mouse in
    function check_In(list) { // InLibs
        let inValue = false;
        let i = 0;
        for (l = list.length; i < l; i++) {
            const cage = list[i];
            if(cage._boundsRect.contains(mX,mY)){
                activeFilters(cage);
                inValue = cage;
                break;
            };
        };
        // clear
        if(inValue && inValue!==(InLibs||InTiles)){clearFilters(list,i)};
        if(!inValue && (InLibs||InTiles)){ clearFilters(list) };
        return inValue;
    };

    // refresh all variable mouse
    function refreshMouse() {
        mX = $mouse.x, mY = $mouse.y;
        mMX = (mX/Zoom.x)+STAGE.CAGE_MAP.pivot.x;
        mMY = (mY/Zoom.y)+STAGE.CAGE_MAP.pivot.y;
        update_Light();
        // update_MouseList();
        if(CAGE_MOUSE.list){ // update cages list hold by mouse
            CAGE_MOUSE.list.x = mMX;
            CAGE_MOUSE.list.y = mMY;
            CAGE_MOUSE.list.zIndex = mMY;
        };
        if(CAGE_MOUSE.previewsShowed){
            CAGE_MOUSE.previews.pivot.x = mX>1920/2 && CAGE_MOUSE.previews.width/2 || 0;
            CAGE_MOUSE.previews.x =  mX/3;
           
            CAGE_MOUSE.previews.y = 900;
        }
    };

//#endregion


//#region [rgba(0, 5, 5,0.5)]
// ┌------------------------------------------------------------------------------┐
// CHECK INTERACTION MOUSE
// └------------------------------------------------------------------------------┘
    function mousemove_Editor(event) {
        if(iziToast.opened){return}; // dont use mouse when toast editor
        refreshMouse();
        InMask = check_InMask(mX,mY);
        if(InMask){
            InLibs = check_In(CAGE_LIBRARY.list) || false;
            InTiles = !InLibs && CAGE_TILESHEETS.open && check_In(CAGE_TILESHEETS.list) || false;
            //InMapObj = (!InLibs&&!InTiles) && checkInMapRegister(REGISTER) || false;
        }else{
            InLibs = false, InTiles = false;
            InButtons = !InLibs && !InTiles &&  check_In(ButtonsSlots) || false;
        };
        if(InTiles){
            checkAnchor(InTiles);
        };
        show_previews(InLibs);
    };

    function mouseup_Editor(event) {
        if(iziToast.opened){return  document.exitPointerLock()}; // dont use mouse when toast editor
        const _clickRight = event.button === 0;
        const clickLeft_ = event.button === 2;
        const click_Middle = event.button === 1;
        const _shift_ = !!event.shiftKey;
        if(_clickRight){// <= right click
            if(CAGE_MOUSE.list){ // 
                return add_toScene(CAGE_MOUSE.list); // copy the current mouse and add to map new obj
            }
            if(InLibs){
                return show_tileSheet(InLibs) //|| hide_tileSheet();
            }
            if (InTiles) {
                return add_toMouse(InTiles);
            }
            if(InButtons){
                return execute_buttons(InButtons);
            }
            if(InMapObj){
                CAGE_MOUSE.currentSprite = InMapObj;
                REGISTER.indexOf(InMapObj);
                const index =  REGISTER.indexOf(InMapObj);
                if(index>-1){
                    REGISTER.splice(index, 1)
                }
                InMapObj = null;
            };
        };

        if(clickLeft_){// => leftClick
            if(CAGE_MOUSE.list){
                CAGE_MAP.removeChild(CAGE_MOUSE.list);
                CAGE_MOUSE.list = null;
            }
        };
    };


    // zoom camera
    function wheel_Editor(event) {
        if(iziToast.opened){return}; // dont use mouse when toast editor
        if(InMask && InMask === "CAGE_TILESHEETS" && CAGE_TILESHEETS.open){
            if(event.wheelDeltaY>0){
                CAGE_TILESHEETS.scale.x+=0.1;
                CAGE_TILESHEETS.scale.y+=0.1;
                CAGE_TILESHEETS.mask.scale.x+=0.1;
                CAGE_TILESHEETS.mask.scale.y+=0.1;
            }else{
                if(CAGE_TILESHEETS.scale._x>0.4){ 
                    CAGE_TILESHEETS.scale.x-=0.1; 
                    CAGE_TILESHEETS.scale.y-=0.1;
                    CAGE_TILESHEETS.mask.scale.x+=0.1; 
                    CAGE_TILESHEETS.mask.scale.y+=0.1;
                }; 
            };
            CAGE_TILESHEETS.list.forEach(cage => { 
                cage.getBounds(true);
                //cage.DebugElements.bg.getBounds()
            });
            
        }else{
            const pos = new PIXI.Point(mX,mY);
            STAGE.CAGE_MAP.toLocal(pos, null, MemCoorZoom1);
            if(event.wheelDeltaY>0){
                Zoom.x+=0.1,Zoom.y+=0.1
            }else{
                if(Zoom._x>0.4){ Zoom.x-=0.1, Zoom.y-=0.1 }; 
            };
            STAGE.CAGE_MAP.toLocal(pos, null, MemCoorZoom2);  // update after scale
            STAGE.CAGE_MAP.pivot.x -= (MemCoorZoom2.x - MemCoorZoom1.x);
            STAGE.CAGE_MAP.pivot.y -= (MemCoorZoom2.y - MemCoorZoom1.y);
            ScrollX -= (MemCoorZoom2.x - MemCoorZoom1.x);
            ScrollY -= (MemCoorZoom2.y - MemCoorZoom1.y);
        }

    };

    function keydown_Editor(event) {
        if (event.ctrlKey && (event.key === "s" || event.key === "S")) {
            // start save Data
            start_DataSaves();
        };
        if (event.ctrlKey && (event.key === "n")) {
            // show all normals
            if(CAGE_TILESHEETS.list){
                CAGE_TILESHEETS.list.forEach(cage => {
                    if(cage.Sprites.n && cage.Sprites.d){
                        cage.Sprites.n.renderable = !cage.Sprites.n.renderable;
                        cage.Sprites.d.renderable = !cage.Sprites.d.renderable;
                    }
                });
            }
            
        };
    };


    document.addEventListener('mousemove', mousemove_Editor.bind(this));
    //document.addEventListener('mousedown', mousedown_Editor);
    document.addEventListener('mouseup',mouseup_Editor.bind(this));
    document.addEventListener('wheel', wheel_Editor);
    document.addEventListener('keydown', keydown_Editor); // change layers
//#endregion



    // Tikers for editor update (document Title, check scroll)
    const editorTiker = new PIXI.ticker.Ticker().add((delta) => {
        document.title = `
        mX: ${~~mX}  mY: ${~~mY} ||  mMX: ${~~mMX}  mMY: ${~~mMY} || ScrollX:${~~ScrollX} ScrollY:${~~ScrollY}
        `;
        if(scrollAllowed){
            let scrolled = false;
            (mX<10 && (ScrollX-=ScrollF) || mX>1920-10 && (ScrollX+=ScrollF)) && (scrolled=true);
            (mY<15 && (ScrollY-=ScrollF) || mY>1080-15 && (ScrollY+=ScrollF)) && (scrolled=true);
            scrolled && (ScrollF+=0.4) || (ScrollF=0.1) ;
        }
        STAGE.CAGE_MAP.pivot.x+=(ScrollX-STAGE.CAGE_MAP.pivot.x)/(scrollSpeed*delta);
        STAGE.CAGE_MAP.pivot.y+=(ScrollY-STAGE.CAGE_MAP.pivot.y)/(scrollSpeed*delta);
    });
    //Game_Player.prototype.updateScroll = function(){}//disable scoll character in editor mode
    editorTiker.start();




    //#region [rgba(100, 5, 0,0.2)]
// ┌------------------------------------------------------------------------------┐
// SAVE COMPUTE JSON
// └------------------------------------------------------------------------------┘
    function spriteToJson(e) { // RENDU ICI VERIFIER CE QUI CLOCHE , ET FORCER LE ZOOM
        const json = {
            name: e.name,
            cage: {
                x: e.x,
                y: e.y,
                rotation: e.rotation,
                alpha: e.alpha,
                blendMode: e.blendMode,
                tint: e.tint,
                scale: {x:e.scale.x, y:e.scale.y},
                skew: {x:e.skew.x, y:e.skew.y},
                pivot: {x:e.pivot.x, y:e.pivot.y},
                autoDisplayGroup: "TODO",
                parentGroup: e.parentGroup.zIndex,
                zIndex: e.zIndex,
            },
            sprites:{
                scale: {x:e.sprite_d.scale.x, y:e.sprite_d.scale.y},
            },
            data:e.data,
        };
        return json;
    };


    function start_DataSaves(options) {
        create_JsonPerma();
        create_SceneJSON();
        //create_JsonMapData();
       // snapScreenMap();
    };

    function create_JsonPerma(options) {
        // create perma json for loader,update from loader: les perma sont defenie dans 
        // file:///C:\Users\jonle\Documents\Games\anft_1.6.1\js\plugins\core_Loader.js#L45
        const data = {SHEETS:{}};
        for (const key in DATA) {
            const e = DATA[key];
            if(e.meta.perma){
                data.SHEETS[e.name] = e;
            };
        };
        const fs = require('fs');
        const content = JSON.stringify(data, null, '\t'); //human read format
        fs.writeFile(`data/perma.json`, content, 'utf8', function (err) { 
            if(err){return console.log(err) };
        });
    };

    // creer la list des data nessesaire
    function create_SceneJSON(options) {
        const currentScene = STAGE.constructor.name;
        const data = {
            SHEETS:{},
            OBJS:[],
            BG:null,
        };
        if(STAGE.Background){
            const d = STAGE.Background.Data;
            data.BG =  d;
            data.SHEETS[d.name] =  d;
        };
        const path = `data/${currentScene}_data.json`; // Map001_data.json
        const fs = require('fs');
        const content = JSON.stringify(data, null, '\t'); //human read format
        fs.writeFile(path, content, 'utf8', function (err) { 
            if(err){return console.log(err) }
            console.log('complette: ', err);
        });
    };

    // creer la list des data nessesaire
    function create_JsonMapData(options) {
        const currentScene = STAGE.constructor.name;
        const currentMap = $player.currentMap;
        const data = {
            galaxi: $player.currentGalaxi, // or map data comment
            planet: $player.currentPlanet, // or map data comment 
            mapID: $player.currentMap, // or map data comment
            sheets:{},
            _obj:[],
        };
        REGISTER.forEach(e => {
            data._obj.push( spriteToJson(e) );
            if(!data.sheets[e.data.name]){
                data.sheets[e.data.name] = {name:e.data.name, path:e.data.dir, register:e.data.dirArray};
            };
        });
        const path = `data/${currentMap}_data.json`; // Map001_data.json
        const fs = require('fs');
        const content = JSON.stringify(data, null, '\t'); //human read format
        fs.writeFile(path, content, 'utf8', function (err) { 
            if(err){return console.log(err) }
            console.log('complette: ', err);
        });
    };

    function snapScreenMap(options) {
        // create a snap to import in rmmv sofware
        STAGE.CAGE_EDITOR.renderable = false;
        const w = STAGE.CAGE_MAP.width;
        const h = STAGE.CAGE_MAP.height;
        STAGE.CAGE_MAP.position.set(0,h);
        STAGE.CAGE_MAP.scale.set(1,-1);
        STAGE.CAGE_MAP.pivot.set(0,0);
        const renderer = PIXI.autoDetectRenderer(w, h);
        const renderTexture = PIXI.RenderTexture.create(w, h);
            renderer.render(STAGE, renderTexture);
        const canvas = renderer.extract.canvas(renderTexture);
        const urlData = canvas.toDataURL();
        const base64Data = urlData.replace(/^data:image\/png;base64,/, "");
        const _fs = require('fs');
        const crypto = window.crypto.getRandomValues(new Uint32Array(1));
        _fs.writeFile(`testSnapStage_${crypto}.png`, base64Data, 'base64', function(error){
            if (error !== undefined && error !== null) {  console.error('An error occured while saving the screenshot', error); } 
        });
        // RESTOR
        STAGE.CAGE_EDITOR.renderable = true;
        STAGE.CAGE_MAP.position.set(0,0);
        STAGE.CAGE_MAP.scale.set(1,1);
        STAGE.CAGE_MAP.pivot.set(0,0);
   };
    //#endregion

//////// ┌------------------------------------------------------------------------------┐
//////// MOUSE TRAILS
////////└------------------------------------------------------------------------------┘
    //Get the texture for Rope.
    function startTrailMouse(){
        var trailTexture = PIXI.Texture.fromImage('editor/trail.png')
        var historyX = []; var historyY = [];
        var historySize = 30;//historySize determines how long the trail will be.
        var ropeSize = 80; //ropeSize determines how smooth the trail will be.
        var points = [];
        //Create history array.
        for( var i = 0; i < historySize; i++){
            historyX.push(0); historyY.push(0);
        }
        //Create rope points.
        for(var i = 0; i < ropeSize; i++){points.push(new PIXI.Point(0,0))};
        //Create the rope
        var rope = new PIXI.mesh.Rope(trailTexture, points);
        rope.blendmode = PIXI.BLEND_MODES.ADD;
        STAGE.CAGE_MOUSE.addChild(rope);
        const trailTiker = PIXI.ticker.shared.add((delta) => {
            historyX.pop();historyX.unshift(mX);
            historyY.pop();historyY.unshift(mY);
            for( var i = 0; i < ropeSize; i++){
                var p = points[i];
                var ix = cubicInterpolation( historyX, i / ropeSize * historySize);
                var iy = cubicInterpolation( historyY, i / ropeSize * historySize);
                p.x = ix; p.y = iy;
            }
        });
        function clipInput(k, arr){
            if (k < 0){k = 0;}
            if (k > arr.length - 1){  k = arr.length - 1;}
            return arr[k];
        };
        function getTangent(k, factor, array){return factor * (clipInput(k + 1, array) - clipInput(k - 1,array)) / 2;}
        function cubicInterpolation(array, t, tangentFactor){
            if (tangentFactor == null) tangentFactor = 1;
            var k = Math.floor(t);
            var m = [getTangent(k, tangentFactor, array), getTangent(k + 1, tangentFactor, array)];
            var p = [clipInput(k,array), clipInput(k+1,array)];
            t -= k;
            var t2 = t * t;
            var t3 = t * t2;
            return (2 * t3 - 3 * t2 + 1) * p[0] + (t3 - 2 * t2 + t) * m[0] + ( -2 * t3 + 3 * t2) * p[1] + (t3 - t2) * m[1];
        };
    };
    startTrailMouse();
};//END EDITOR

