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
        this._scene = null; // asign the current sceneLoader
        this.isLoading = false; // loading status
        this.loaderSet = {}; // sloaderSet from JSONlIST =>.json ***
        // FIRST TIME BOOT, NEED ALL JSON LIST
        Object.defineProperties(this, {
            "_JsonPath": {
                value: {
                    MapInfos:"data/MapInfos.json", // also load all maps Map###_data.json and create galaxi register
                    Perma:"data/perma.json", // perma , Enemies,cursor,loader,Avatar...
                    Scene_IntroVideo:"data/Scene_IntroVideo.json",
                   /* Scene_Boot:"data/Scene_Boot.json",
                    Scene_IntroVideo:"data/Scene_IntroVideo.json",
                    Scene_Local:"data/Scene_Local.json",
                    Scene_Title:"data/Scene_Title.json",*/
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
    console.log6('set: ', set);
    const loader = new PIXI.loaders.Loader();
    for (const key in this.loaderSet[set]) {
        const data = this.loaderSet[set][key];
        loader.add(key, `${data.dir}/${data.base}`);
        loader.resources[key].dataSet = data;
    };

    loader.onProgress.add((loader, res) => {
        console.log('res: ', res);
        if(!res.dataSet){return}; // jump atlas ...
        const path = [res.dataSet.dirArray[0],res.dataSet.dirArray[1],res.name]
        const register = this.checkRegistryPathIntegrity(path);
        
        if (res.dataSet.meta.type === "spineSheet") { 
            register._spineData = res.spineData;
        };
    });

    loader.onComplete.add((loader, res) => {
    // INITALISE BASIC CORE PLUGINS
        PIXI.utils.clearTextureCache();
        this._scene.isLoading = false;
    });

    loader.load();
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


_coreLoader.prototype.checkRegistryPathIntegrity = function(path) { // from [dirArray[0],dirArray[1],dirArray.name]
    // check l'integity sur 3 niveau, construire objet auto
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

