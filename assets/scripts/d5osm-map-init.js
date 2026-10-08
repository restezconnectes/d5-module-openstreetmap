/**
 * D5 OpenStreetMap - Initialisation des cartes
 *
 * @package D5OSM
 * @since 1.0.0
 */

(function($) {
    'use strict';

    /**
     * Initialise une carte OpenStreetMap
     *
     * @param {string} mapId ID de la carte
     * @param {object} config Configuration de la carte
     */
    function initMap(mapId, config) {
        if (typeof L === 'undefined') {
            console.error('Leaflet is not loaded');
            return;
        }

        var mapElement = document.getElementById(mapId);
        if (!mapElement) {
            return;
        }

        // Options de la carte. zoomControl reste désactivé ici : Leaflet crée sinon
        // son propre L.Control.Zoom avec des info-bulles "Zoom in"/"Zoom out" codées
        // en dur en anglais dans leaflet.min.js (non traduisibles via notre système
        // de traduction, qui ne peut pas patcher une librairie tierce) — on ajoute
        // notre propre contrôle juste après, avec des titres traduits.
        var mapOptions = {
            maxZoom: config.maxZoom || 18,
            minZoom: config.minZoom || 0,
            zoomControl: false,
            scrollWheelZoom: config.scrollWheelZoom === true,
            doubleClickZoom: config.doubleClickZoom === true
        };

        // Créer la carte
        var map = L.map(mapId, mapOptions).setView(
            [config.latitude || 47.4, config.longitude || 1.6],
            config.zoom || 5.5
        );

        if (config.showZoomControls !== false) {
            L.control.zoom({
                zoomInTitle: (typeof d5osm_vars !== 'undefined' && d5osm_vars.zoomInTitle) || 'Zoom in',
                zoomOutTitle: (typeof d5osm_vars !== 'undefined' && d5osm_vars.zoomOutTitle) || 'Zoom out'
            }).addTo(map);
        }

        // Définir les couches de base
        var osmLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        var osmUrl = 'https://{s}.tile.osm.org/{z}/{x}/{y}.png';
        var osmAttrib = '&copy; ' + osmLink + ' Contributors';
        var esriUrl = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';
        var landUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
        var thunAttrib = '&copy; ' + osmLink + ' Contributors & OpenStreetMap HOT';
        var EsriWorldImageryUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        var EsriWorldImageryAttrib = '&copy; ' + osmLink + ' Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
        var CyclOSMUrl = 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png';
        var CyclOSMAttrib = '&copy; ' + osmLink + ' <a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

        var osmMap = L.tileLayer(osmUrl, {attribution: osmAttrib});
        var esriMap = L.tileLayer(esriUrl, {attribution: ''});
        var landMap = L.tileLayer(landUrl, {attribution: thunAttrib});
        var EsriWorldImagery = L.tileLayer(EsriWorldImageryUrl, {attribution: EsriWorldImageryAttrib});
        var CyclOSM = L.tileLayer(CyclOSMUrl, {attribution: CyclOSMAttrib});

        var baseLayers = {
            'OSM Mapnik': osmMap,
            'OpenStreetMap France': esriMap,
            'OpenStreetMap HOT': landMap,
            'Satellite': EsriWorldImagery,
            'Cycle OSM': CyclOSM
        };

        // Ajouter la couche de base
        var baseLayer = L.tileLayer(config.baseLayer || osmUrl, {});
        baseLayer.addTo(map);

        // Contrôleur de couches
        if (config.controlLayers === true) {
            L.control.layers(baseLayers).addTo(map);
        }

        // Recherche géocodage
        if (config.displaySearch === true && typeof L.esri !== 'undefined') {
            var optionsSearchMap = {
                placeholder: (typeof d5osm_vars !== 'undefined' && d5osm_vars.searchPlaceholder) || 'Search for places or addresses',
                // maxResults: how many suggestions the dropdown shows while
                // typing — kept at the library default (5).
                providers: [
                    L.esri.Geocoding.arcgisOnlineProvider({ maxResults: 5 })
                ],
                // allowMultipleResults (control option, defaults to true in
                // esri-leaflet-geocoder): if the user presses Enter WITHOUT
                // picking one of the dropdown suggestions, the library falls
                // back to a broad free-text geocode and plots one marker per
                // candidate — this is what earlier dropped several markers
                // for a single search. Clicking (or arrowing to) a specific
                // suggestion already resolves to exactly that one place
                // regardless of this option, via its "magic key" — which is
                // the flow we want. Disabling this just removes the
                // ambiguous "Enter with nothing selected" fallback.
                allowMultipleResults: false
            };
            var searchControlMap = L.esri.Geocoding.geosearch(optionsSearchMap).addTo(map);
            var resultsMap = L.layerGroup().addTo(map);

            function colorMarkerMap(color) {
                var svgTemplate = '<svg xmlns="https://www.w3.org/2000/svg" viewBox="0 0 32 32" class="marker">' +
                    '<path fill-opacity=".25" d="M16 32s1.427-9.585 3.761-12.025c4.595-4.805 8.685-.99 8.685-.99s4.044 3.964-.526 8.743C25.514 30.245 16 32 16 32z"/>' +
                    '<path stroke="#fff" fill="' + color + '" d="M15.938 32S6 17.938 6 11.938C6 .125 15.938 0 15.938 0S26 .125 26 11.875C26 18.062 15.938 32 15.938 32zM16 6a4 4 0 100 8 4 4 0 000-8z"/>' +
                    '</svg>';
                return L.divIcon({
                    className: 'marker',
                    html: svgTemplate,
                    iconSize: [40, 40],
                    iconAnchor: [12, 24],
                    popupAnchor: [7, -16]
                });
            }

            searchControlMap.on('results', function(data) {
                resultsMap.clearLayers();
                // `providers[].maxResults` (see above) controls the dropdown
                // suggestion count, but esri-leaflet-geocoder also reuses it
                // as `maxLocations` on the final geocode request — even one
                // fired for a single clicked/selected suggestion (its
                // magicKey) can still come back with several location
                // candidates. Only the first (best-ranked) one is the place
                // the user actually picked.
                if (data.results && data.results.length > 0) {
                    resultsMap.addLayer(new L.marker(data.results[0].latlng, {
                        icon: colorMarkerMap(config.searchColor || '#fe6c58')
                    }));
                }
            });
        }

        // MiniMap
        if (config.displayMinimap === true && typeof L.Control !== 'undefined' && L.Control.MiniMap) {
            var toggleDisplay = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
            var osm2 = new L.TileLayer(config.baseLayer || esriUrl, {
                minZoom: 0,
                maxZoom: 13,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            });
            var miniMap = new L.Control.MiniMap(osm2, {toggleDisplay: toggleDisplay}).addTo(map);
        }

        // Géolocalisation : bouton personnalisé (icône "cible", point bleu pulsant +
        // cercle de précision, viseur rouge quand actif) au lieu de la librairie
        // L.Control.Locate vendorée — cf. https://leaflet.restezconnectes.fr/#49.location-button
        if (config.displayLocation === true) {
            (function() {
                var locateLayers = new L.FeatureGroup();
                var locateLink = null;

                function showLocateMessage(text) {
                    var existing = mapElement.querySelector('.d5osm-locate-message');
                    if (existing) {
                        existing.textContent = text;
                        return;
                    }
                    var legend = L.control({position: 'bottomleft'});
                    legend.onAdd = function() {
                        var div = L.DomUtil.create('div', 'd5osm-locate-message');
                        L.DomEvent.disableClickPropagation(div);
                        div.textContent = text;
                        return div;
                    };
                    legend.addTo(map);
                }

                function onLocationFound(e) {
                    locateLayers.clearLayers();
                    L.circle(e.latlng, {
                        radius: e.accuracy / 2,
                        weight: 2,
                        stroke: false,
                        fillColor: '#136aec',
                        fillOpacity: 0.15
                    }).addTo(locateLayers);
                    L.marker(e.latlng, {
                        icon: L.divIcon({className: 'd5osm-located-animation', iconSize: L.point(17, 17)})
                    }).addTo(locateLayers);
                    locateLayers.addTo(map);
                }

                function onLocationError() {
                    showLocateMessage((typeof d5osm_vars !== 'undefined' && d5osm_vars.locateErrorText) || 'Location access denied.');
                }

                function toggleLocate() {
                    var active = L.DomUtil.hasClass(locateLink, 'd5osm-locate-active');
                    if (active) {
                        L.DomUtil.removeClass(locateLink, 'd5osm-locate-active');
                        map.stopLocate();
                        map.off('locationfound', onLocationFound);
                        map.off('locationerror', onLocationError);
                        map.removeLayer(locateLayers);
                        return;
                    }
                    L.DomUtil.addClass(locateLink, 'd5osm-locate-active');
                    map.on('locationfound', onLocationFound);
                    map.on('locationerror', onLocationError);
                    map.locate({setView: true, enableHighAccuracy: true});
                }

                var LocateControl = L.Control.extend({
                    options: {position: 'topleft'},
                    onAdd: function() {
                        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control d5osm-locate-button');
                        locateLink = L.DomUtil.create('a', '', container);
                        locateLink.href = '#';
                        var locateTitle = (typeof d5osm_vars !== 'undefined' && d5osm_vars.locateButtonTitle) || 'Locate me';
                        locateLink.title = locateTitle;
                        locateLink.setAttribute('role', 'button');
                        locateLink.setAttribute('aria-label', locateTitle);
                        locateLink.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">'
                            + '<path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';

                        L.DomEvent.on(locateLink, 'click', function(e) {
                            L.DomEvent.stop(e);
                            toggleLocate();
                        });

                        return container;
                    }
                });

                map.addControl(new LocateControl());
            })();
        }

        // Bouton "Accueil" : recentre la carte sur la position/zoom initiaux configurés.
        if (config.displayHomeButton === true) {
            var HomeControl = L.Control.extend({
                options: {position: 'topleft'},
                onAdd: function() {
                    var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control d5osm-home-control');
                    var link = L.DomUtil.create('a', '', container);
                    link.href = '#';
                    var homeTitle = (typeof d5osm_vars !== 'undefined' && d5osm_vars.homeButtonTitle) || 'Reset view';
                    link.title = homeTitle;
                    link.setAttribute('role', 'button');
                    link.setAttribute('aria-label', homeTitle);
                    link.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 3.1 3 10.5V21h6v-6h6v6h6V10.5z"/></svg>';

                    L.DomEvent.on(link, 'click', function(e) {
                        L.DomEvent.stop(e);
                        map.setView(
                            [config.latitude || 47.4, config.longitude || 1.6],
                            config.zoom || 5.5
                        );
                    });

                    return container;
                }
            });
            map.addControl(new HomeControl());
        }

        // Barre latérale (remplace la popup) : cf. maquette fournie par l'utilisateur
        // — https://leaflet.restezconnectes.fr/#59.sidebar-replacing-popup
        // Scopée au conteneur de CETTE carte (pas de classes sur <body>, contrairement
        // à la maquette) pour que plusieurs cartes sur une même page ne se marchent pas dessus.
        var sidebarApi = null;
        if (config.displaySidebar === true) {
            sidebarApi = setupSidebar(mapElement, map);
        }

        function setupSidebar(mapEl, mapInstance) {
            var wrapper = document.createElement('div');
            wrapper.className = 'd5osm_map_wrapper';
            // Couleurs de l'onglet Style > Sidebar (déjà validées côté PHP), appliquées via
            // des variables CSS scopées à ce wrapper — chaque carte garde ses propres couleurs.
            // Un pin peut surcharger chacune (valeur vide = celle de la carte) : on recalcule
            // donc l'ensemble à chaque ouverture, pour qu'un pin sans surcharge ne garde pas
            // les couleurs du pin précédent.
            function applyColors(pinData) {
                var colors = {
                    '--d5osm-sidebar-bg': (pinData && pinData.sidebarBgColor) || config.sidebarBgColor,
                    '--d5osm-sidebar-text': (pinData && pinData.sidebarTextColor) || config.sidebarTextColor,
                    '--d5osm-sidebar-btn-bg': (pinData && pinData.sidebarButtonBgColor) || config.sidebarButtonBgColor,
                    '--d5osm-sidebar-btn-border': (pinData && pinData.sidebarButtonBorderColor) || config.sidebarButtonBorderColor,
                    '--d5osm-sidebar-btn-text': (pinData && pinData.sidebarButtonTextColor) || config.sidebarButtonTextColor,
                    // Chaîne "0" (bordure supprimée) est truthy en JS ; seule la chaîne vide hérite.
                    '--d5osm-sidebar-btn-border-width': ((pinData && pinData.sidebarButtonBorderWidth) || config.sidebarButtonBorderWidth || '') + ''
                };
                if (colors['--d5osm-sidebar-btn-border-width'] !== '') {
                    colors['--d5osm-sidebar-btn-border-width'] += 'px';
                }
                Object.keys(colors).forEach(function(name) {
                    if (colors[name]) {
                        wrapper.style.setProperty(name, colors[name]);
                    } else {
                        wrapper.style.removeProperty(name);
                    }
                });
            }
            applyColors(null);
            mapEl.parentNode.insertBefore(wrapper, mapEl);

            var sidebar = document.createElement('div');
            sidebar.className = 'd5osm_sidebar';
            var closeLabel = (typeof d5osm_vars !== 'undefined' && d5osm_vars.closeSidebarLabel) || 'Close';
            sidebar.innerHTML = '<button type="button" class="d5osm_sidebar_close" aria-label="' + closeLabel + '" title="' + closeLabel + '">&times;</button><div class="d5osm_sidebar_content"></div>';
            wrapper.appendChild(sidebar);
            wrapper.appendChild(mapEl);

            var contentEl = sidebar.querySelector('.d5osm_sidebar_content');

            function invalidateAfterTransition() {
                setTimeout(function() { mapInstance.invalidateSize(); }, 320);
            }

            function open(html, latlng, pinData) {
                applyColors(pinData);
                contentEl.innerHTML = html;
                wrapper.classList.add('d5osm_sidebar_active');
                invalidateAfterTransition();
                // Recentre pour que le marqueur reste visible à côté de la barre ouverte.
                if (latlng) {
                    try {
                        var sidebarWidth = Math.min(sidebar.offsetWidth, wrapper.offsetWidth * 0.9);
                        var point = mapInstance.project(latlng, mapInstance.getZoom()).subtract([-sidebarWidth / 2, 0]);
                        mapInstance.panTo(mapInstance.unproject(point, mapInstance.getZoom()), {animate: true});
                    } catch (e) {
                        // Recentrage best-effort : une erreur ici ne doit pas empêcher l'ouverture.
                    }
                }
            }

            function close() {
                wrapper.classList.remove('d5osm_sidebar_active');
                invalidateAfterTransition();
            }

            sidebar.querySelector('.d5osm_sidebar_close').addEventListener('click', close);

            return {open: open, close: close};
        }

        // Groupe de marqueurs
        var markerClusters = null;
        var markers = [];

        // Fonction pour créer une icône personnalisée
        function createCustomIcon(iconUrl, iconWidth, iconHeight) {
            if (!iconUrl) return null;
            return L.icon({
                iconUrl: iconUrl,
                iconSize: [parseInt(iconWidth) || 33, parseInt(iconHeight) || 44],
                iconAnchor: [parseInt(iconWidth) / 2 || 16.5, parseInt(iconHeight) || 44],
                popupAnchor: [0, -parseInt(iconHeight) || -44]
            });
        }

        // Fonction pour obtenir l'URL de l'icône
        function getIconUrl(iconName, customUrl, defaultWidth, defaultHeight) {
            if (customUrl) {
                return customUrl;
            }
            // URL de base pour les icônes
            var baseUrl = d5osm_vars.imagesUrl || '';
            return baseUrl + iconName + '.png';
        }

        // Traiter les marqueurs depuis les données
        if (config.pins && Array.isArray(config.pins) && config.pins.length > 0) {
            markerClusters = L.markerClusterGroup();
            
            config.pins.forEach(function(pinData) {
                try {
                    var iconUrl = getIconUrl(
                        pinData.icon || config.defaultIcon || 'default',
                        pinData.iconUrl || config.defaultIconUrl,
                        pinData.iconWidth || config.defaultIconWidth || 33,
                        pinData.iconHeight || config.defaultIconHeight || 44
                    );
                    
                    var icon = createCustomIcon(
                        iconUrl,
                        pinData.iconWidth || config.defaultIconWidth || 33,
                        pinData.iconHeight || config.defaultIconHeight || 44
                    );
                    
                    var marker = L.marker(
                        [pinData.latitude, pinData.longitude],
                        {icon: icon, title: pinData.title || ''}
                    );
                    
                    // Les marqueurs issus du Custom Post Type respectent l'option "Show Markers Only".
                    var skipPopup = pinData.isCpt && config.showMarkersOnly === true;

                    // Créer le contenu du popup
                    var popupContent = '';
                    // Même contenu pour la barre latérale, mais "Lire la suite" y devient un
                    // bouton (couleurs de l'onglet Style > Sidebar) au lieu d'un simple lien.
                    var sidebarContent = '';
                    if (!skipPopup) {
                        if (pinData.thumbnail) {
                            if (pinData.linkUrl) {
                                popupContent += '<a href="' + pinData.linkUrl + '" target="' + (pinData.linkTarget || '_self') + '" class="d5osm_thumb"><img src="' + pinData.thumbnail + '" alt="" /></a><br>';
                            } else {
                                popupContent += '<img src="' + pinData.thumbnail + '" alt="" class="d5osm_thumb" /><br>';
                            }
                        }
                        if (pinData.title) {
                            if (pinData.linkUrl) {
                                popupContent += '<strong><a href="' + pinData.linkUrl + '" target="' + (pinData.linkTarget || '_self') + '">' + pinData.title + '</a></strong>';
                            } else {
                                popupContent += '<strong>' + pinData.title + '</strong>';
                            }
                        }
                        if (pinData.content) {
                            popupContent += '<br>' + pinData.content;
                        }
                        sidebarContent = popupContent;
                        if (pinData.showReadMore && pinData.linkUrl) {
                            var readmoreClass = 'd5osm_readmore' + (pinData.readMoreClass ? ' ' + pinData.readMoreClass : '');
                            var readmoreText = pinData.readMoreText || (typeof d5osm_vars !== 'undefined' && d5osm_vars.defaultReadMoreText) || 'Read More...';
                            var readmoreAttrs = 'href="' + pinData.linkUrl + '" target="' + (pinData.linkTarget || '_self') + '"';
                            popupContent += '<br><a ' + readmoreAttrs + ' class="' + readmoreClass + '">' + readmoreText + '</a>';
                            sidebarContent += '<a ' + readmoreAttrs + ' class="' + readmoreClass + ' d5osm_readmore_button">' + readmoreText + '</a>';
                        }
                    }

                    if (popupContent) {
                        if (sidebarApi) {
                            marker.on('click', function() {
                                sidebarApi.open(sidebarContent, marker.getLatLng(), pinData);
                            });
                        } else {
                            marker.bindPopup(popupContent);
                        }
                    }

                    markers.push(marker);
                    markerClusters.addLayer(marker);
                } catch (e) {
                    console.error('Error creating marker:', e, pinData);
                }
            });
            
            if (markerClusters && markers.length > 0) {
                map.addLayer(markerClusters);
                
                // Ajuster la vue pour afficher tous les marqueurs
                if (config.fitMarkers === true) {
                    var group = new L.featureGroup(markers);
                    map.fitBounds(group.getBounds().pad(0.5), {maxZoom: config.zoom || 5.5});
                }
            }
        }

        // Stocker la référence de la carte
        window.d5osm_maps = window.d5osm_maps || {};
        window.d5osm_maps[mapId] = map;
    }

    // Initialiser toutes les cartes au chargement
    $(document).ready(function() {
        // Attendre que Leaflet soit chargé
        if (typeof L !== 'undefined') {
            // Initialiser les cartes depuis les données localisées
            for (var key in window) {
                if (key.indexOf('d5osm_map_') === 0) {
                    var mapId = key.replace('d5osm_map_', '');
                    var config = window[key];
                    if (config && document.getElementById(mapId)) {
                        initMap(mapId, config);
                    }
                }
            }
        } else {
            // Attendre le chargement de Leaflet
            $(window).on('load', function() {
                setTimeout(function() {
                    if (typeof L !== 'undefined') {
                        for (var key in window) {
                            if (key.indexOf('d5osm_map_') === 0) {
                                var mapId = key.replace('d5osm_map_', '');
                                var config = window[key];
                                if (config && document.getElementById(mapId)) {
                                    initMap(mapId, config);
                                }
                            }
                        }
                    }
                }, 100);
            });
        }
    });

})(jQuery);
