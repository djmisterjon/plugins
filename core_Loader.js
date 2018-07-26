/*:
// PLUGIN □────────────────────────────────□ LOADER CLASS □─────────────────────────────────────────┐
* @author □ Jonathan Lepage (dimisterjon),(jonforum) 
* @plugindesc loader class for the sceneLoader
* V.1.0
* License:© M.I.T
*VERY IMPORTANT NOTE: Export from texturePacker with trimmed Name (remove extention.png for use tile normal)
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
NOTE AND HELP:
-LOADDER TYPE
loaderSet_loadingData:[loadingSprite,mouseSprite]
loaderSet_PermaData:[GUI,players,sound]
loaderSet_IntroVideo:[videoIntro]
loaderSet_Scene_Local:[local flag,music]
loaderSet_TitleScene:[titleSprites,musicTitle,movies,saveGameJson]
loaderSet_PlanetData:[monsterSprites,doodadSprites,planeteMusics] // dossier global et planet only (global peut etre utiliser dans plusieur planet )
loaderSet_MapScene:[dataMapJson,mapSprites(diff,norm)]
loaderSet_GalaxiScene:[dataMapJson,mapSprites(diff,norm)]
*/

// ┌-----------------------------------------------------------------------------┐
// GLOBAL $Loader CLASS: _coreLoader for pixi loader management and caches
//└------------------------------------------------------------------------------┘

class _coreLoader {
    constructor () {
        this._tmp = {}; // tmp, when loading , sore all sheet here before start Normalize structure.
        this.Data2 = {};
        this._scene = null; // asign the current sceneLoader
        this.isLoading = false; // loading status
        this.loaderSet = {}; // sloaderSet from JSONlIST =>.json ***
        // FIRST TIME BOOT, NEED ALL JSON LIST
        Object.defineProperties(this, {
            "_JsonPath": {
                value: {
                    MapInfos:"data/MapInfos.json", // also load all maps Map###_data.json and create galaxi register
                    Perma:"data/perma.json", // perma , Enemies,cursor,loader,Avatar...
                    //Scene_Local_data:"data/Scene_Local_data.json",
                    //Scene_IntroVideo:"data/Scene_IntroVideo.json",
                    //Scene_Boot:"data/Scene_Boot.json",
                    //Scene_IntroVideo:"data/Scene_IntroVideo.json",
                    //Scene_Local_data:"data/Scene_Local_data.json",
                    //Scene_Title:"data/Scene_Title.json",
                },
            }
          });
          Object.defineProperties(this, {
            "_permaName": { // perma name for editor build meta.json, juste the name are ok
                value: ["gloves",],
            }
          });
    };
    
    get BaseTextureCache () { return PIXI.utils.BaseTextureCache };
    get TextureCache () { return PIXI.utils.TextureCache };
    get utils () { return PIXI.utils };
};

const $Loader = new _coreLoader();
console.log1('$Loader.', $Loader);

// update information in sceneLoader
_coreLoader.prototype.updateSceneLoader = function(res) {
    this._scene._progress = 0;
    this._scene._progressTxt = [];
};

// ┌-----------------------------------------------------------------------------┐
// LOADER JSON
// special boot once loader for json
//└------------------------------------------------------------------------------┘
// $Loader.preLoad_Json();
_coreLoader.prototype.preLoad_Json = function() {
    // MapInfos and Scene### base
    const L0 = function(){
        const loader0 = new PIXI.loaders.Loader();
        for (const key in this._JsonPath) {
            loader0.add(key, this._JsonPath[key]);
        };
        loader0.load();
        loader0.onProgress.add((loader, res) => {
            this.loaderSet[res.name] = res.data;
        });
        loader0.onComplete.add((loader, res) => {
            L1.call(this);
        });
    };
    L0.call(this);
    const L1 = function(){
        // Scene_Map
        const loader1 = new PIXI.loaders.Loader();
        this.loaderSet.Scene_Map = {};
        this.loaderSet.MapInfos.forEach(map => {
            if(map){
                const id = map.id.padZero(3);
                const path = `data/Map${id}.json`;
                loader1.add(id, path);
            };
        });
        loader1.load();
        loader1.onProgress.add((loader, res) => {
            this.loaderSet.Scene_Map[res.name] = res.data;
            res.data.data = null; // clear the rmmv data
        });
        loader1.onComplete.add((loader, res) => {
            L2.call(this);
        });
    };

    const L2 = function(){
        // Scene_Map .DATA
        const loader2 = new PIXI.loaders.Loader();
        this.loaderSet.MapInfos.forEach(map => {
            if(map){
                const id = map.id.padZero(3);
                const path = `data/Map${id}_data.json`;
                loader2.add(id, path);
            };
        });
        loader2.load();
        loader2.onProgress.add((loader, res) => {
            this.loaderSet.Scene_Map[res.name].data = res.data;
        });
        loader2.onComplete.add((loader, res) => {
            L3.call(this);
        });
    };

    const L3 = function(){
        // build planet information
        this.loaderSet.PlanetsInfos = {};
        for (const key in this.loaderSet.Scene_Map) {
            const data = this.loaderSet.Scene_Map[key].data;
            const planetID = data.planet;
            // registering all planet id existe from rmmv comment json
            if(planetID && !this.loaderSet.PlanetsInfos[planetID]){
                this.loaderSet.PlanetsInfos[planetID] = {};
            };
            // scan all game maps and store sheets need for each planet id
            for (const sheetKey in data.sheets) {
                this.loaderSet.PlanetsInfos[planetID][sheetKey] = data.sheets[sheetKey];
            };
        };
       this._scene.isLoading = false; // allow continue scene laoder
    };
};

// ┌-----------------------------------------------------------------------------┐
// LOADER DATA
//└------------------------------------------------------------------------------┘
// $Loader.load(['loaderSet',loaderSet]);
_coreLoader.prototype.load = function(set) {
    console.log6('_________________________________set: ', set);
    if(!this.loaderSet[set]){return this._scene.isLoading = false};
    const loader = new PIXI.loaders.Loader();
    for (const key in this.loaderSet[set].SHEETS) { // L:SHEETS
        const data = this.loaderSet[set].SHEETS[key];
        loader.add(key, `${data.dir}/${data.base}`);
        loader.resources[key].dataJ = data;
        if(data.meta.normal){
            loader.add(key+"_n", `${data.dir}/${data.name}_n.json`);
            loader.resources[key+"_n"].dataJ =  data;
           
        };
    };

    loader.onProgress.add((loader, res) => {

        if(res.dataJ){
            const isNormal = res.name.contains("_n");
            const type = res.dataJ.meta.type || false;
            //const reg = this.checkRegistryPathIntegrity(res.dataJ);
            if(type){ // avoid use altlas .. and other files
                if(type === "spineSheet"){
                    Object.defineProperty(res.dataJ, "spineData", { value: res.spineData, writable:true });
                };
                if(type === "animationSheet"){ // use temp_
                    Object.defineProperty(res.dataJ, "textures", { value: {} ,writable:true });
                    Object.defineProperty(res.dataJ, "textures_n", { value: {} ,writable:true });
                    for (const aniKey in res.dataJ.animations) {
                        res.dataJ.textures[aniKey] = [];
                        res.dataJ.textures_n[aniKey] = [];
                    };
                    res.dataJ._tempTextures = res.textures; // temporaire textures, attend d'etre classer pour Multipack ou animation
                    res.dataJ._tempTextures_n = {}; // temporaire textures, attend d'etre classer pour Multipack ou animation
                };
                if(type === "tileSheet"){
                    if(isNormal){
                        Object.defineProperty(res.dataJ, "textures_n", { value: {} ,writable:true });
                        res.dataJ._tempTextures_n = res.textures; // temporaire textures, attend d'etre classer pour Multipack ou animation
                    }else{
                        Object.defineProperty(res.dataJ, "textures", { value: {} ,writable:true });
                        res.dataJ._tempTextures = res.textures; // temporaire textures, attend d'etre classer pour Multipack ou animation
                    }; 
                }
                this._tmp[res.name] = res.dataJ;
            };
            
        };
    });

    loader.onComplete.add((loader, res) => {
    // INITALISE BASIC CORE PLUGINS
        this.combineNormalData();
        //this.combineMultiPack();
        this.combineTextures(); // reduce _tempTextures to texture for animation Multi pack
        this.mergeDataTmp();


        PIXI.utils.clearTextureCache();
        this._scene.isLoading = false;
    });

    loader.load();
};

  // trouve tous les datas avec _n  et merge avec original data (fusion) ++
  _coreLoader.prototype.combineNormalData = function() {
    for (const key in this._tmp) {
        if(key.contains("_n")){ // it a normal sheets
            const currentData = this._tmp[key];
            const targetData =  this._tmp[key.replace("_n", "")];
            Object.assign(targetData._tempTextures_n, currentData.textures_n); 
            targetData.meta.normal = true;
            targetData.base_n = this._tmp[key].base;
            delete this._tmp[key];
        };
    };
 };

 _coreLoader.prototype.combineTextures = function() {
    for (const key in this._tmp) {
        const data = this._tmp[key];
        if(data.meta.type !== "spineSheet"){
             // if is animations sheets, need splits all aniamtions from pack
            if(data.animations){
                Object.entries(data.animations).forEach(e => {
                    const animationName = e[0];
                    const texturesList = e[1];
                    const temp = [], temp_n = [];
                    texturesList.forEach(texName => {
                        const texture = data._tempTextures[texName];
                        const texture_n = data._tempTextures_n[texName+"_n"];
                        const storage = data.textures[animationName];
                        const storage_n = data.textures_n[animationName];
                        storage.push(texture);
                        storage_n && storage_n.push(texture_n); // if normal
                    });
                });
            }else{
                if(data.meta.isBG){
                    const singleTexName = Object.keys(data._tempTextures)[0];
                    const singleTexName_n = Object.keys(data._tempTextures_n)[0]
                    data.textures =  data._tempTextures[singleTexName];
                    data.textures_n =  data._tempTextures_n[singleTexName_n];
                }else{
                    // is tileSheets without aniamtions
                    data.textures =  data._tempTextures;
                    data.textures_n =  data._tempTextures_n;
                }
  
            };
            delete data._tempTextures;
            delete data._tempTextures_n;
        };
    };
 };

  // merge temp data in Data2 for avaible use. Only if not existe
  _coreLoader.prototype.mergeDataTmp = function() {
    for (const key in this._tmp) {
        if(!this.Data2[key]){
            Object.defineProperty(this.Data2, key, { value: this._tmp[key] , enumerable:!this._tmp[key].meta.perma });
        }
    };
 };

_coreLoader.prototype.load_planetData = function(set) { // ["g1","p1"] : ["galaxiID","planetID"]
// TODO: generer avec l'editeur un json pour la map, pour permet de voir comment gerer le planet loader qui load chaque mapData associer
// egalement ajouter le path des map dans le spriteJSON via lediteur
    const planets = this.loaderSet[set[0]][set[1]];
    const loader = new PIXI.loaders.Loader();
    for (const mapID in planets) {
        const map = planets[mapID];
        // TODO: PRENDRE VIA LE JSON GENERER DU MAP EDITOR POUR LES PARRALAXE
        const bgName = map.parallaxName;
        if(!bgName){continue};
        const bgMap_d = `${map.parallaxName}_d`;
        const bgMap_n = `${map.parallaxName}_n`;
        //const regPath = [_planet, _bg, mapID];
        loader.add(bgMap_d, `data2/_planet/p1/bg/${bgMap_d}.png`);
        loader.add(bgMap_n, `data2/_planet/p1/bg/${bgMap_n}.png`);
        loader.resources[bgMap_d].mapID = mapID;
        loader.resources[bgMap_n].mapID = mapID;
        loader.resources[bgMap_d].dataMap = map;
        loader.resources[bgMap_n].dataMap = map;
        loader.resources[bgMap_n].normal = true;
        
    };
    loader.load();
    loader.onProgress.add((loader, res) => {
        !(this._planet._bg[res.mapID]) && (this._planet._bg[res.mapID] = {});
        if (res.normal) {
            this._planet._bg[res.mapID].texture_n = res.texture;
        }else{
            this._planet._bg[res.mapID].texture = res.texture;
        }
    });

    loader.onComplete.add((loader, res) => {
        this.isLoading = false;
    });
  
};


_coreLoader.prototype.checkRegistryPathIntegrity = function(data) { // from [dirArray[0],dirArray[1],dirArray.name]
    // check l'integity sur 3 niveau, construire objet auto
    const path = data.dirArray;
    !this[path[0]] && (this[path[0]] = {});
    !this[path[0]][path[1]] && (this[path[0]][path[1]] = {});
    !this[path[0]][path[1]][path[2]] && (this[path[0]][path[1]][path[2]] = {});
    return this[path[0]][path[1]][path[2]];
};

// ┌-----------------------------------------------------------------------------┐
// COMPUTE SHEETSTYPE
//└------------------------------------------------------------------------------┘

_coreLoader.prototype.computeFromType = function(res) {
    // check type => return build essential data;
    switch (res.dataFromSet.sheetType) {
        case "animationSheets": this.compute_animationSheets(res); break;
        case "spriteSheets": this.compute_spriteSheets(res); break;
        case "spineSheets": this.compute_spineSheets(res); break;
        case "sprite": this.compute_sprites(res); break;
        case "video": this.compute_video(res); break;
    };
};

_coreLoader.prototype.compute_animationSheets = function(res) {
    const array = res.isNormal && res.reg.textures_n || res.reg.textures;
    for( let texture in res.textures ) {
        array.push(res.textures[texture]);
    };
    res.reg.dataFromSet = res.dataFromSet;
};

_coreLoader.prototype.compute_spineSheets = function(res) {
    res.reg.spineData = res.spineData;
    res.reg.dataFromSet = res.dataFromSet;
};

_coreLoader.prototype.compute_sprites = function(res) {
    res.isNormal && (res.reg.texture_n = res.texture) || (res.reg.texture = res.texture)
    res.reg.dataFromSet = res.dataFromSet;
};

_coreLoader.prototype.compute_video = function(res) {
    res.reg.data = res.data;
};

// splitter used for split multi aniamtion name in a altas
_coreLoader.prototype.splitTexturesByName = function(res) {
    res.dataFromSet.splitter.forEach(splitName => {
        !(res.reg["textures"+splitName]) && (res.reg["textures"+splitName] = []); // create reg. if not exist
        !(res.reg["textures"+splitName+"_n"]) && (res.reg["textures"+splitName+"_n"] = []); // create reg. if not exist
        res.reg.textures_n.forEach(texture => {
            if(texture.textureCacheIds[0].indexOf(splitName+"_n")>-1){
                res.reg["textures"+splitName+"_n"].push(texture);
            };
        });
        res.reg.textures.forEach(texture => {
            if(texture.textureCacheIds[0].indexOf(splitName)>-1){
                res.reg["textures"+splitName].push(texture);
            };
        });
    });
    res.reg.textures = [];
    res.reg.textures_n = [];
 
};


//┌-----------------------------------------------------------------------------┐
// DESTOY MANAGER
// Destroy all tmp cache, an also all pixi object created in scene
// pixi text, pixi grafics, 
//└-----------------------------------------------------------------------------┘

