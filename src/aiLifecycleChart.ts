import * as d3 from 'd3';

interface LifecycleStage {
  id: string;
  index: string;
  label: string;
  shortLabel: string;
  purity: number;
  deliverable: string;
  metric: string;
  inputArtifact: string;
  outputArtifact: string;
  tooling: string;
  summary: string;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: 'cleaning',
    index: '01',
    label: 'Data Cleaning',
    shortLabel: 'Data Cleaning',
    purity: 62,
    deliverable: 'Curated Corpus',
    metric: '25,000+ Frames',
    inputArtifact: 'Raw Field Imagery & SQL Logs',
    outputArtifact: 'Normalized, Deduplicated Corpus',
    tooling: 'Python · Pandas · OpenCV · BigQuery',
    summary:
      'Ingests raw multi-source imagery and operational tables, strips corrupted or duplicate records, aligns geospatial projections, and validates schema integrity before annotation.'
  },
  {
    id: 'annotation',
    index: '02',
    label: 'Annotation',
    shortLabel: 'Annotation',
    purity: 84,
    deliverable: 'QA-Verified Labels',
    metric: '1,800+ Ha Mapped',
    inputArtifact: 'Cleaned Imagery & Geo Layers',
    outputArtifact: 'Validated Bounding Boxes & Polygons',
    tooling: 'QGIS · Label QA Scripts · OpenCV',
    summary:
      'Executes precision bounding-box, polygon, and plantation parcel labeling backed by automated geometry checks to enforce class consistency and zero annotation drift.'
  },
  {
    id: 'training',
    index: '03',
    label: 'Model Training',
    shortLabel: 'Model Training',
    purity: 93,
    deliverable: 'Trained Weights',
    metric: 'YOLO · TF · PyTorch',
    inputArtifact: 'Stratified Train / Val Splits',
    outputArtifact: 'Checkpointed Model Weights',
    tooling: 'YOLO · TensorFlow · PyTorch · Keras',
    summary:
      'Trains and iterates on computer vision and predictive models using domain-specific augmentation, transfer learning, and reproducible experiment tracking.'
  },
  {
    id: 'evaluation',
    index: '04',
    label: 'Evaluation',
    shortLabel: 'Evaluation',
    purity: 97,
    deliverable: 'Validated Release',
    metric: '94.2% mAP@50',
    inputArtifact: 'Holdout Test Suite & Edge Cases',
    outputArtifact: 'Assessment Report & Deployable Weights',
    tooling: 'Scikit-learn · Confusion Matrix · TensorFlow',
    summary:
      'Measures precision, recall, mAP@50, and inference latency across real-world scenarios, routing hard failure cases back into Data Cleaning for targeted dataset refinement.'
  }
];

function initAiLifecycleChart(): void {
  const container = document.getElementById('ai-lifecycle-chart');
  if (!container) return;

  const detailIndexEl = document.getElementById('lifecycle-detail-index');
  const detailTitleEl = document.getElementById('lifecycle-detail-title');
  const detailSummaryEl = document.getElementById('lifecycle-detail-summary');
  const detailInputEl = document.getElementById('lifecycle-detail-input');
  const detailOutputEl = document.getElementById('lifecycle-detail-output');
  const detailToolingEl = document.getElementById('lifecycle-detail-tooling');
  const stageButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.lifecycle-stage-btn')
  );
  const cycleButton = document.getElementById('lifecycle-cycle-btn') as HTMLButtonElement | null;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const width = 900;
  const height = 392;
  const nodeY = 82;
  const nodeWidth = 176;
  const nodeHeight = 84;
  const chartTop = 228;
  const chartBottom = 346;

  d3.select(container).selectAll('svg').remove();

  const svg = d3
    .select(container)
    .append('svg')
    .attr('id', 'ai-lifecycle-svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img')
    .attr(
      'aria-label',
      'D3.js visualization of the AI training lifecycle stages: Data Cleaning, Annotation, Model Training, and Evaluation'
    );

  const defs = svg.append('defs');

  const areaGrad = defs
    .append('linearGradient')
    .attr('id', 'lifecycle-area-grad')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
  areaGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.3);
  areaGrad.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.02);

  const lineGrad = defs
    .append('linearGradient')
    .attr('id', 'lifecycle-line-grad')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%');
  lineGrad.append('stop').attr('offset', '0%').attr('stop-color', '#34d399');
  lineGrad.append('stop').attr('offset', '100%').attr('stop-color', '#10b981');

  const arrowActive = defs
    .append('marker')
    .attr('id', 'lifecycle-arrow-active')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 8)
    .attr('refY', 5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto-start-reverse');
  arrowActive.append('path').attr('d', 'M 0 1.5 L 9 5 L 0 8.5 z').attr('fill', '#10b981');

  const arrowMuted = defs
    .append('marker')
    .attr('id', 'lifecycle-arrow-muted')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 8)
    .attr('refY', 5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto-start-reverse');
  arrowMuted
    .append('path')
    .attr('d', 'M 0 1.5 L 9 5 L 0 8.5 z')
    .attr('fill', 'rgba(255, 255, 255, 0.36)');

  const xScale = d3
    .scalePoint<string>()
    .domain(LIFECYCLE_STAGES.map((d) => d.id))
    .range([112, 788]);

  const yScale = d3.scaleLinear().domain([45, 100]).range([chartBottom, chartTop]);

  const stageX = (id: string): number => xScale(id) ?? 0;

  /* 1. Iterative Feedback Loop Arc (Evaluation -> Data Cleaning) */
  const feedbackLayer = svg.append('g').attr('class', 'lifecycle-feedback-layer');
  const startFeedbackX = stageX('evaluation');
  const endFeedbackX = stageX('cleaning');
  const feedbackStartY = nodeY + nodeHeight / 2 + 4;
  const feedbackPathData = [
    `M ${startFeedbackX} ${feedbackStartY}`,
    `C ${startFeedbackX} 174, ${endFeedbackX} 174, ${endFeedbackX} ${feedbackStartY}`
  ].join(' ');

  feedbackLayer
    .append('path')
    .attr('d', feedbackPathData)
    .attr('fill', 'none')
    .attr('stroke', 'rgba(16, 185, 129, 0.32)')
    .attr('stroke-width', 1.4)
    .attr('stroke-dasharray', '4 4')
    .attr('marker-end', 'url(#lifecycle-arrow-active)');

  feedbackLayer
    .append('text')
    .attr('x', width / 2)
    .attr('y', 162)
    .attr('text-anchor', 'middle')
    .attr('fill', 'rgba(255, 255, 255, 0.56)')
    .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
    .attr('font-size', '11px')
    .attr('letter-spacing', '0.06em')
    .text('Iterative Data-Centric Feedback Loop (Hard Examples -> Re-Cleaning)');

  /* 2. Forward Stage Connectors */
  const connectors = LIFECYCLE_STAGES.slice(0, -1).map((stage, idx) => ({
    index: idx,
    from: stage,
    to: LIFECYCLE_STAGES[idx + 1]
  }));

  const connectorPaths = svg
    .append('g')
    .attr('class', 'lifecycle-connectors')
    .selectAll('line')
    .data(connectors)
    .join('line')
    .attr('x1', (d) => stageX(d.from.id) + nodeWidth / 2 + 4)
    .attr('y1', nodeY)
    .attr('x2', (d) => stageX(d.to.id) - nodeWidth / 2 - 4)
    .attr('y2', nodeY)
    .attr('stroke', 'rgba(255, 255, 255, 0.24)')
    .attr('stroke-width', 1.8)
    .attr('marker-end', 'url(#lifecycle-arrow-muted)');

  /* 3. Lower D3 Readiness Curve Grid & Axes */
  const chartLayer = svg.append('g').attr('class', 'lifecycle-chart-layer');

  chartLayer
    .append('text')
    .attr('x', 40)
    .attr('y', 202)
    .attr('fill', 'rgba(255, 255, 255, 0.58)')
    .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('letter-spacing', '0.08em')
    .text('DATASET SIGNAL PURITY & MODEL READINESS TRAJECTORY (%)');

  const yTicks = [50, 75, 100];
  const gridGroup = chartLayer.append('g').attr('class', 'lifecycle-grid');

  gridGroup
    .selectAll('line')
    .data(yTicks)
    .join('line')
    .attr('x1', 76)
    .attr('x2', 844)
    .attr('y1', (d) => yScale(d))
    .attr('y2', (d) => yScale(d))
    .attr('stroke', 'rgba(255, 255, 255, 0.08)')
    .attr('stroke-width', 1);

  gridGroup
    .selectAll('text')
    .data(yTicks)
    .join('text')
    .attr('x', 66)
    .attr('y', (d) => yScale(d) + 3.5)
    .attr('text-anchor', 'end')
    .attr('fill', 'rgba(255, 255, 255, 0.44)')
    .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
    .attr('font-size', '10.5px')
    .style('font-variant-numeric', 'tabular-nums')
    .text((d) => `${d}%`);

  const areaGen = d3
    .area<LifecycleStage>()
    .x((d) => stageX(d.id))
    .y0(chartBottom)
    .y1((d) => yScale(d.purity))
    .curve(d3.curveMonotoneX);

  const lineGen = d3
    .line<LifecycleStage>()
    .x((d) => stageX(d.id))
    .y((d) => yScale(d.purity))
    .curve(d3.curveMonotoneX);

  chartLayer
    .append('path')
    .datum(LIFECYCLE_STAGES)
    .attr('class', 'lifecycle-area')
    .attr('d', areaGen)
    .attr('fill', 'url(#lifecycle-area-grad)');

  const readinessLine = chartLayer
    .append('path')
    .datum(LIFECYCLE_STAGES)
    .attr('class', 'lifecycle-curve')
    .attr('d', lineGen)
    .attr('fill', 'none')
    .attr('stroke', 'url(#lifecycle-line-grad)')
    .attr('stroke-width', 2.4)
    .attr('stroke-linecap', 'round');

  /* Vertical drop indicator connecting active node to readiness curve */
  const guideLine = chartLayer
    .append('line')
    .attr('class', 'lifecycle-guide-line')
    .attr('y1', nodeY + nodeHeight / 2 + 2)
    .attr('y2', chartBottom)
    .attr('stroke', 'rgba(16, 185, 129, 0.36)')
    .attr('stroke-width', 1.2)
    .attr('stroke-dasharray', '3 3');

  /* Curve data points */
  const pointGroups = chartLayer
    .selectAll<SVGGElement, LifecycleStage>('g.lifecycle-point')
    .data(LIFECYCLE_STAGES)
    .join('g')
    .attr('class', 'lifecycle-point')
    .attr('transform', (d) => `translate(${stageX(d.id)}, ${yScale(d.purity)})`)
    .style('cursor', 'pointer')
    .on('click', (_, d) => {
      stopAutoCycle();
      selectStage(LIFECYCLE_STAGES.indexOf(d));
    });

  const pointRings = pointGroups
    .append('circle')
    .attr('r', 11)
    .attr('fill', 'rgba(16, 185, 129, 0.16)')
    .attr('stroke', 'rgba(16, 185, 129, 0.5)')
    .attr('stroke-width', 1)
    .attr('opacity', 0);

  const pointDots = pointGroups
    .append('circle')
    .attr('r', 4.5)
    .attr('fill', '#0a0c0d')
    .attr('stroke', '#10b981')
    .attr('stroke-width', 2);

  const pointLabels = pointGroups
    .append('text')
    .attr('y', -14)
    .attr('text-anchor', 'middle')
    .attr('fill', 'rgba(255, 255, 255, 0.78)')
    .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
    .attr('font-size', '11.5px')
    .attr('font-weight', '600')
    .style('font-variant-numeric', 'tabular-nums')
    .text((d) => `${d.purity}%`);

  chartLayer
    .selectAll<SVGTextElement, LifecycleStage>('text.lifecycle-x-label')
    .data(LIFECYCLE_STAGES)
    .join('text')
    .attr('class', 'lifecycle-x-label')
    .attr('x', (d) => stageX(d.id))
    .attr('y', chartBottom + 24)
    .attr('text-anchor', 'middle')
    .attr('fill', 'rgba(255, 255, 255, 0.62)')
    .attr('font-size', '11.5px')
    .attr('font-weight', '500')
    .text((d) => `${d.index}. ${d.shortLabel}`);

  /* 4. Interactive Stage Nodes */
  const nodeGroups = svg
    .append('g')
    .attr('class', 'lifecycle-nodes')
    .selectAll<SVGGElement, LifecycleStage>('g.lifecycle-node')
    .data(LIFECYCLE_STAGES)
    .join('g')
    .attr('class', 'lifecycle-node')
    .attr('transform', (d) => `translate(${stageX(d.id)}, ${nodeY})`)
    .attr('tabindex', '0')
    .attr('role', 'button')
    .attr('aria-label', (d) => `Stage ${d.index}: ${d.label} — ${d.metric}`)
    .style('cursor', 'pointer')
    .on('click', (_, d) => {
      stopAutoCycle();
      selectStage(LIFECYCLE_STAGES.indexOf(d));
    })
    .on('keydown', (event: KeyboardEvent, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        stopAutoCycle();
        selectStage(LIFECYCLE_STAGES.indexOf(d));
      }
    });

  const nodeCards = nodeGroups
    .append('rect')
    .attr('x', -nodeWidth / 2)
    .attr('y', -nodeHeight / 2)
    .attr('width', nodeWidth)
    .attr('height', nodeHeight)
    .attr('rx', 12)
    .attr('fill', 'rgba(12, 15, 16, 0.86)')
    .attr('stroke', 'rgba(255, 255, 255, 0.16)')
    .attr('stroke-width', 1.2);

  const nodeTopBars = nodeGroups
    .append('rect')
    .attr('x', -nodeWidth / 2 + 12)
    .attr('y', -nodeHeight / 2)
    .attr('width', nodeWidth - 24)
    .attr('height', 2)
    .attr('rx', 1)
    .attr('fill', '#10b981')
    .attr('opacity', 0);

  nodeGroups
    .append('text')
    .attr('x', -nodeWidth / 2 + 14)
    .attr('y', -18)
    .attr('fill', '#10b981')
    .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .style('font-variant-numeric', 'tabular-nums')
    .text((d) => `STAGE ${d.index}`);

  nodeGroups
    .append('text')
    .attr('x', nodeWidth / 2 - 14)
    .attr('y', -18)
    .attr('text-anchor', 'end')
    .attr('fill', 'rgba(255, 255, 255, 0.56)')
    .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
    .attr('font-size', '10.5px')
    .style('font-variant-numeric', 'tabular-nums')
    .text((d) => d.metric);

  nodeGroups
    .append('text')
    .attr('x', -nodeWidth / 2 + 14)
    .attr('y', 7)
    .attr('fill', '#ffffff')
    .attr('font-size', '14.5px')
    .attr('font-weight', '600')
    .attr('letter-spacing', '-0.02em')
    .text((d) => d.label);

  nodeGroups
    .append('text')
    .attr('x', -nodeWidth / 2 + 14)
    .attr('y', 26)
    .attr('fill', 'rgba(255, 255, 255, 0.62)')
    .attr('font-size', '11.5px')
    .text((d) => d.deliverable);

  let activeIndex = 0;
  let cycleTimer: number | null = null;

  function animateCurveEntrance(): void {
    const lineNode = readinessLine.node();
    if (!lineNode || prefersReducedMotion) return;
    const totalLength = lineNode.getTotalLength();
    readinessLine
      .interrupt()
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(950)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0)
      .on('end', () => {
        readinessLine.attr('stroke-dasharray', null);
      });
  }

  function selectStage(index: number): void {
    activeIndex = (index + LIFECYCLE_STAGES.length) % LIFECYCLE_STAGES.length;
    const stage = LIFECYCLE_STAGES[activeIndex];
    const dur = prefersReducedMotion ? 0 : 220;

    nodeCards
      .transition()
      .duration(dur)
      .attr('fill', (_, i) =>
        i === activeIndex ? 'rgba(16, 185, 129, 0.14)' : 'rgba(12, 15, 16, 0.86)'
      )
      .attr('stroke', (_, i) =>
        i === activeIndex ? 'rgba(16, 185, 129, 0.85)' : i < activeIndex ? 'rgba(16, 185, 129, 0.36)' : 'rgba(255, 255, 255, 0.16)'
      )
      .attr('stroke-width', (_, i) => (i === activeIndex ? 1.6 : 1.2));

    nodeTopBars
      .transition()
      .duration(dur)
      .attr('opacity', (_, i) => (i === activeIndex ? 1 : 0));

    connectorPaths
      .transition()
      .duration(dur)
      .attr('stroke', (d) =>
        d.index < activeIndex ? '#10b981' : 'rgba(255, 255, 255, 0.24)'
      )
      .attr('marker-end', (d) =>
        d.index < activeIndex ? 'url(#lifecycle-arrow-active)' : 'url(#lifecycle-arrow-muted)'
      );

    guideLine
      .transition()
      .duration(dur)
      .ease(d3.easeCubicOut)
      .attr('x1', stageX(stage.id))
      .attr('x2', stageX(stage.id));

    pointRings
      .transition()
      .duration(dur)
      .attr('opacity', (_, i) => (i === activeIndex ? 1 : 0));

    pointDots
      .transition()
      .duration(dur)
      .attr('r', (_, i) => (i === activeIndex ? 6 : 4.5))
      .attr('fill', (_, i) => (i === activeIndex ? '#10b981' : '#0a0c0d'));

    pointLabels
      .transition()
      .duration(dur)
      .attr('fill', (_, i) => (i === activeIndex ? '#34d399' : 'rgba(255, 255, 255, 0.72)'));

    stageButtons.forEach((btn, i) => {
      const isActive = i === activeIndex;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (detailIndexEl) {
      detailIndexEl.textContent = `Stage ${stage.index} of 04 · ${stage.purity}% Signal Purity`;
    }
    if (detailTitleEl) detailTitleEl.textContent = stage.label;
    if (detailSummaryEl) detailSummaryEl.textContent = stage.summary;
    if (detailInputEl) detailInputEl.textContent = stage.inputArtifact;
    if (detailOutputEl) detailOutputEl.textContent = stage.outputArtifact;
    if (detailToolingEl) detailToolingEl.textContent = stage.tooling;
  }

  function stopAutoCycle(): void {
    if (cycleTimer !== null) {
      window.clearInterval(cycleTimer);
      cycleTimer = null;
    }
    if (cycleButton) {
      cycleButton.classList.remove('is-playing');
      cycleButton.setAttribute('aria-pressed', 'false');
      cycleButton.textContent = 'Play Pipeline';
    }
  }

  function startAutoCycle(): void {
    stopAutoCycle();
    if (cycleButton) {
      cycleButton.classList.add('is-playing');
      cycleButton.setAttribute('aria-pressed', 'true');
      cycleButton.textContent = 'Pause';
    }
    cycleTimer = window.setInterval(() => {
      selectStage(activeIndex + 1);
    }, 2600);
  }

  stageButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      stopAutoCycle();
      selectStage(idx);
    });
  });

  if (cycleButton) {
    cycleButton.addEventListener('click', () => {
      if (cycleTimer !== null) {
        stopAutoCycle();
      } else {
        startAutoCycle();
      }
    });
  }

  window.addEventListener('portfolio:about-opened', () => {
    animateCurveEntrance();
  });

  window.addEventListener('portfolio:about-closed', () => {
    stopAutoCycle();
  });

  selectStage(0);
  if (document.body.classList.contains('is-about-view')) {
    animateCurveEntrance();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAiLifecycleChart);
} else {
  initAiLifecycleChart();
}
