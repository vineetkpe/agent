import { CrawledPage } from "./crawler";
import { BusinessProfile } from "./businessIntelligence";

export interface GraphNode {
  id: string;
  url?: string;
  title: string;
  type: "page" | "product" | "service" | "topic";
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: "links_to" | "about_product" | "about_service";
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildKnowledgeGraph(
  crawledPages: CrawledPage[],
  businessProfile: BusinessProfile
): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const uniqueNodeIds = new Set<string>();

  // Helper to add nodes without duplicates
  const addNode = (node: GraphNode) => {
    if (!uniqueNodeIds.has(node.id)) {
      uniqueNodeIds.add(node.id);
      nodes.push(node);
    }
  };

  // 1. Add page nodes
  for (const page of crawledPages) {
    addNode({
      id: page.url,
      url: page.url,
      title: page.title || page.url,
      type: "page",
    });
  }

  // 2. Add product nodes
  const products = businessProfile.products || [];
  for (const p of products) {
    if (!p || !p.name) continue;
    const pId = `product:${p.name}`;
    addNode({
      id: pId,
      url: p.sourceUrl || undefined,
      title: p.name,
      type: "product",
    });
  }

  // 3. Add service nodes
  const services = businessProfile.services || [];
  for (const s of services) {
    if (!s || !s.name) continue;
    const sId = `service:${s.name}`;
    addNode({
      id: sId,
      url: s.sourceUrl || undefined,
      title: s.name,
      type: "service",
    });
  }

  // 4. Build links_to edges from page internal links
  const crawledUrls = new Set(crawledPages.map((p) => p.url));
  const uniqueEdges = new Set<string>();

  const addEdge = (edge: GraphEdge) => {
    const key = `${edge.from}->${edge.to}:${edge.relation}`;
    if (!uniqueEdges.has(key)) {
      uniqueEdges.add(key);
      edges.push(edge);
    }
  };

  for (const page of crawledPages) {
    // If internal links were captured, use them
    const links = page.internalLinks || [];
    for (const link of links) {
      if (crawledUrls.has(link) && link !== page.url) {
        addEdge({
          from: page.url,
          to: link,
          relation: "links_to",
        });
      }
    }

    // 5. Match pages to products and services
    const contentText = `${page.title || ""} ${page.visibleText || ""}`.toLowerCase();

    for (const p of products) {
      if (!p || !p.name) continue;
      const lowerName = p.name.toLowerCase();
      // Match product name as substring in content text
      if (contentText.includes(lowerName)) {
        addEdge({
          from: page.url,
          to: `product:${p.name}`,
          relation: "about_product",
        });
      }
    }

    for (const s of services) {
      if (!s || !s.name) continue;
      const lowerName = s.name.toLowerCase();
      // Match service name as substring in content text
      if (contentText.includes(lowerName)) {
        addEdge({
          from: page.url,
          to: `service:${s.name}`,
          relation: "about_service",
        });
      }
    }
  }

  return { nodes, edges };
}

export interface MissingInternalLink {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  reason: string;
}

export function findMissingInternalLinks(graph: KnowledgeGraph): MissingInternalLink[] {
  const missingLinks: MissingInternalLink[] = [];

  // Get all target nodes of type service or product that have a URL
  const targets = graph.nodes.filter(
    (n) => (n.type === "service" || n.type === "product") && n.url
  );

  for (const target of targets) {
    const targetUrl = target.url!;
    
    // Find all pages that mention / are about this target
    const aboutEdges = graph.edges.filter(
      (e) => e.to === target.id && (e.relation === "about_product" || e.relation === "about_service")
    );

    for (const edge of aboutEdges) {
      const sourceUrl = edge.from;

      // Check if there is already an actual hyperlink (links_to) from sourceUrl to targetUrl
      const linksToExists = graph.edges.some(
        (e) => e.from === sourceUrl && e.to === targetUrl && e.relation === "links_to"
      );

      if (!linksToExists) {
        missingLinks.push({
          sourceUrl,
          targetUrl,
          anchorText: target.title, // suggested anchor text
          reason: `Page ${sourceUrl} discusses '${target.title}' but does not link to its page at ${targetUrl}.`,
        });
      }
    }
  }

  return missingLinks;
}
