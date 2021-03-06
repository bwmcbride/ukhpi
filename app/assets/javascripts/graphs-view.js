/** Component for showing the queried index data as a set of graphs */

modulejs.define( "graphs-view", [
  "lib/lodash",
  "lib/jquery",
  "lib/d3",
  "preferences",
  "aspects"
], function(
  _,
  $,
  D3,
  Preferences,
  Aspects
) {
  "use strict";

  var GraphView = function() {
    this.preferences = new Preferences();
    this.graphConf = {};
  };

  var SERIES_MARKER = {
    "":               "circle",
    "Detached":       "diamond",
    "SemiDetached":   "square",
    "Terraced":       "triangle-down",
    "FlatMaisonette": "triangle-up"
  };

  var GRAPHS_OPTIONS = {
    averagePrice: {
      cssClass: "average-price",
      ticksCount: 5,
      yDomain: ""
    },
  };

  var GRAPH_PADDING = {
    top: 30,
    right: 20,
    bottom: 20,
    left: 80
  };
  GRAPH_PADDING.horizontal = GRAPH_PADDING.left + GRAPH_PADDING.right;
  GRAPH_PADDING.vertical = GRAPH_PADDING.top + GRAPH_PADDING.bottom;

  /* Methods */

  _.extend( GraphView.prototype, {
    prefs: function() {
      return this.preferences;
    },

    showQueryResults: function( qr ) {
      var gv = this;
      var dateRange = qr.dateRange();

      _.each( this.prefs().indicators(), function( indicator ) {
        var options = GRAPHS_OPTIONS[indicator];
        if (options) {
          gv.graphConf[indicator] = {};
          var graphConf = gv.graphConf[indicator];

          graphConf.elem = revealGraphElem( options );
          graphConf.root = drawGraphRoot( graphConf );

          var valueRange = calculateValueRange( indicator, gv.prefs(), qr, options );
          _.merge( graphConf, configureAxes( graphConf, dateRange, valueRange, options ) );
          drawAxes( graphConf );
          drawPoints( indicator, gv.prefs(), qr, graphConf, options );
        }
      } );
    }
  } );


  /* Helper functions */

  var revealGraphElem = function( options ) {
    var selector = ".js-graph." + options.cssClass;
    $( selector )
      .removeClass( "hidden" )
      .find( "svg" )
      .empty();
    return D3.select( selector + " svg" );
  };

  var configureAxes = function( graphConf, dateRange, valueRange, options ) {
    var scales = createScales( graphConf.elem );
    var axes = createAxes( scales, options );

    setScaleDomain( scales, dateRange, valueRange );

    return {
      scales: scales,
      axes: axes
    };
  };

  var createScales = function( graphElem ) {
    var xScale = D3.time.scale().nice(D3.time.month);
    var yScale = D3.scale.linear();
    return setScaleViewDimensions( xScale, yScale, graphElem );
  };

  var setScaleViewDimensions = function( xScale, yScale, elem ) {
    var width = parseInt( elem.style("width") ) - GRAPH_PADDING.horizontal;
    var height = parseInt( elem.style("height") ) - GRAPH_PADDING.vertical;

    xScale.range( [0, width] );
    yScale.range( [height, 0] );

    return {x: xScale, y: yScale, width: width, height: height};
  };

  var createAxes = function( scales, options ) {
    var xAxis = D3.svg.axis()
      .scale( scales.x )
      .orient("bottom")
      .tickFormat(D3.time.format("%b %Y"));

    var yAxis = D3.svg.axis()
      .scale( scales.y )
      .orient("left")
      .ticks( options.ticksCount );

    return {x: xAxis, y: yAxis};
  };

  var setScaleDomain = function( scales, dateRange, valueRange ) {
    scales.x.domain( dateRange );
    scales.y.domain( valueRange ).nice();
  };

  var calculateValueRange = function( indicator, prefs, qr, options ) {
    var aspects = aspectNames( indicator, prefs );
    var extents = _.map( aspects, function( aspect ) {
      return D3.extent( qr.results(), function( result ) {
        return result.value( aspect );
      } );
    } );

    var overallRange = D3.extent( _.flatten( extents ) );

    if (options.symmetricalYAxis) {
      var largest = _.max( _.map( overallRange, Math.abs ) );
      return [largest * -1.0, largest];
    }
    else {
      return [0, overallRange[1]];
    }
  };

  var aspectNames = function( indicator, prefs ) {
    var aspects = prefs.aspects( {indicators: [indicator]} );
    return _.map( aspects, function( a ) {return "ukhpi:" + a;} );
  };

  var drawGraphRoot = function( graphConf ) {
    return graphConf
      .elem
      .append("g")
      .attr("transform", "translate(" + GRAPH_PADDING.left + "," + GRAPH_PADDING.top + ")");
  };

  var drawAxes = function( graphConf ) {
    graphConf.root
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + graphConf.scales.height + ")")
      .call( graphConf.axes.x );
    graphConf.root
      .append("g")
      .attr("class", "y axis")
      .call( graphConf.axes.y );
  };

  var drawPoints = function( indicator, prefs, qr, graphConf, options ) {
    var x = graphConf.scales.x;
    var y = graphConf.scales.y;

    var s = _.map( prefs.categories(), function( c ) {
      return qr.series( indicator, c );
    } );

    graphConf.root
      .selectAll(".point")
      .data( _.flatten(s) )
      .enter()
      .append("path")
      .attr("class", function( d ) {return "point " + d.cat;} )
      .attr("d", function( d, i ) {return D3.svg.symbol().type( SERIES_MARKER[d.cat] )( d, i );} )
      .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

  };

  return GraphView;
} );
