import React, { Component } from "react";
import "./App.css";
import * as d3 from "d3";

class App extends Component {
  constructor(props) {
    super(props);
    // simple state as requested
    this.state = { wordFrequency: [] };
  }

  componentDidMount() {
    this.renderChart();
  }

  componentDidUpdate() {
    this.renderChart();
  }

  getWordFrequency = (text) => {
    const stopWords = new Set([
      "the","and","a","an","in","on","at","is","it","to","of","for","with","as","by","from",
      "that","this","be","are","was","were","but","or","so","if","then","than","there","their",
      "they","them","you","your","i","we","us","our","he","she","his","her","its","not","do",
      "does","did","have","has","had","been","would","could","should","about","into","over","under",
      "between","through","up","down","out","off","my","myself","yourself","yourselves"
    ]);

    const words = (text || "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w && !stopWords.has(w));

    const map = new Map();
    for (const w of words) map.set(w, (map.get(w) || 0) + 1);

    return Array.from(map, ([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
      .slice(0, 5);
  };

  renderChart() {
    const data = this.state.wordFrequency; // top 5, sorted desc by count
    const svg = d3.select(".svg_parent");

    // fixed layout size
    const width = 1000;
    const height = 380;
    svg.attr("width", width).attr("height", height);

    // If no data, clear and exit
    if (!data || data.length === 0) {
      svg.selectAll("*").remove();
      return;
    }

    // compute font scale (guard against equal min/max)
    const counts = data.map(d => d.count);
    const minC = d3.min(counts);
    const maxC = d3.max(counts);
    const fontScale = d3.scaleLinear()
      .domain(minC === maxC ? [minC - 1, maxC + 1] : [minC, maxC])
      .range([24, 72]);

    // linear x scale across indices 0..n-1 (assignment requirement)
    const n = data.length;
    const leftPad = 150;
    const rightPad = 150;
    const xScale = d3.scaleLinear().domain([0, Math.max(1, n - 1)]).range([leftPad, width - rightPad]);

    const centerY = height / 2;

    // KEYED JOIN so D3 tracks each word element across updates by word
    const sel = svg.selectAll("text.word").data(data, d => d.word);

    // EXIT: fade out and remove
    sel.exit()
      .transition()
      .duration(600)
      .style("opacity", 0)
      .style("font-size", "1px")
      .remove();

    // ENTER: place at its new x, tiny then grow to proper size
    const enter = sel.enter()
      .append("text")
      .attr("class", "word")
      .attr("text-anchor", "middle")
      // initial position at final index's x (so it grows at its eventual place)
      .attr("x", (_, i) => xScale(i))
      .attr("y", centerY)
      .style("opacity", 0)
      .style("font-size", "1px")
      .text(d => d.word);

    enter.transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .style("opacity", 1)
      .style("font-size", d => `${fontScale(d.count)}px`);

    // UPDATE: smoothly move to new x and new font size when frequencies/ranks change
    sel.transition()
      .duration(900)
      .ease(d3.easeCubicInOut)
      .attr("x", (_, i) => xScale(i))           // index i corresponds to new rank in current data array
      .attr("y", centerY)
      .style("font-size", d => `${fontScale(d.count)}px`)
      .style("opacity", 1);

    // (note) we left DOM order as-is; setting x by index ensures they move to positions reflecting new ranking
  }

  render() {
    return (
      <div className="parent">
        <div className="child1" style={{ width: 1000 }}>
          <textarea
            type="text"
            id="input_field"
            style={{ height: 150, width: 1000 }}
            defaultValue={`The streets were filled with people, people walking, people talking, people laughing, people in a hurry. Everyone seemed to be in a rush, moving quickly from one place to another. The city was alive with activity, with people everywhere you looked. The noise of the city was constant, with cars honking, people chatting, and footsteps echoing through the streets. It was a city full of people, a city where life never stopped.`}
          />
          <button
            type="submit"
            value="Generate Matrix"
            style={{ marginTop: 10, height: 40, width: 1000 }}
            onClick={() => {
              const v = document.getElementById("input_field").value;
              // compute top-5 and set state; next renderChart call will animate changes
              this.setState({ wordFrequency: this.getWordFrequency(v) });
            }}
          >
            Generate WordCloud
          </button>
        </div>
        <div className="child2">
          <svg className="svg_parent"></svg>
        </div>
      </div>
    );
  }
}

export default App;
