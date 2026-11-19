use super::FrontendCtx;
use crate::ast::runtype::Runtype;
use crate::{BffFileName, FileManager, ParsedModule};
use std::collections::BTreeMap;
use swc_common::Span;
use swc_common::comments::CommentKind;

fn clean_jsdoc_comment(text: &str) -> Option<String> {
    let text = text.trim_start();
    let text = text.strip_prefix('*').unwrap_or(text);
    let mut lines = text
        .lines()
        .map(|line| {
            let line = line.trim_start();
            let line = line.strip_prefix('*').unwrap_or(line);
            line.strip_prefix(' ')
                .unwrap_or(line)
                .trim_end()
                .to_string()
        })
        .collect::<Vec<_>>();

    while lines.first().is_some_and(|line| line.trim().is_empty()) {
        lines.remove(0);
    }
    while lines.last().is_some_and(|line| line.trim().is_empty()) {
        lines.pop();
    }

    let description = lines.join("\n");
    if description.trim().is_empty() {
        None
    } else {
        Some(description)
    }
}

#[cfg(test)]
mod jsdoc_tests {
    use super::{clean_jsdoc_comment, is_jsdoc_comment};
    use swc_common::comments::{Comment, CommentKind};
    use swc_common::DUMMY_SP;

    fn comment(kind: CommentKind, text: &str) -> Comment {
        Comment {
            kind,
            span: DUMMY_SP,
            text: text.into(),
        }
    }

    #[test]
    fn clean_jsdoc_comment_normalizes_single_line_text() {
        assert_eq!(
            clean_jsdoc_comment("* Single line description."),
            Some("Single line description.".to_string())
        );
    }

    #[test]
    fn clean_jsdoc_comment_normalizes_multiline_text() {
        assert_eq!(
            clean_jsdoc_comment(
                r#"*
                 * First line.
                 *
                 * Second line.
                 "#
            ),
            Some("First line.\n\nSecond line.".to_string())
        );
    }

    #[test]
    fn clean_jsdoc_comment_ignores_empty_text() {
        assert_eq!(clean_jsdoc_comment("*"), None);
        assert_eq!(
            clean_jsdoc_comment(
                r#"*
                 *
                 "#
            ),
            None
        );
    }

    #[test]
    fn is_jsdoc_comment_only_accepts_block_jsdoc_comments() {
        assert!(is_jsdoc_comment(&comment(CommentKind::Block, "* Description.")));
        assert!(!is_jsdoc_comment(&comment(CommentKind::Block, " Description.")));
        assert!(!is_jsdoc_comment(&comment(CommentKind::Line, "* Description.")));
    }
}

#[derive(Debug)]
struct JsdocCandidate {
    key_pos: u32,
    end_pos: u32,
    description: String,
}

#[derive(Debug, Default)]
pub(super) struct JsdocFileCache {
    candidates: Vec<JsdocCandidate>,
    direct_descriptions_by_key: BTreeMap<u32, Vec<String>>,
    resolved_by_span_lo: BTreeMap<u32, Option<String>>,
}

fn is_jsdoc_comment(comment: &swc_common::comments::Comment) -> bool {
    comment.kind == CommentKind::Block && comment.text.trim_start().starts_with('*')
}

fn byte_pos_to_source_offset(pos: u32, source_start: u32) -> Option<usize> {
    pos.checked_sub(source_start).map(|it| it as usize)
}

fn jsdoc_candidate_matches_declaration(
    candidate: &JsdocCandidate,
    source: &str,
    source_start: u32,
    declaration_pos: u32,
) -> bool {
    let Some(comment_end) = byte_pos_to_source_offset(candidate.end_pos, source_start) else {
        return false;
    };
    let Some(declaration_start) = byte_pos_to_source_offset(declaration_pos, source_start) else {
        return false;
    };

    let directly_before = source
        .get(comment_end..declaration_start)
        .is_some_and(|between| between.trim().is_empty());
    if directly_before {
        return true;
    }

    let Some(comment_key) = byte_pos_to_source_offset(candidate.key_pos, source_start) else {
        return false;
    };
    let Some(before_key) = source.get(comment_end..comment_key) else {
        return false;
    };
    let Some(before_declaration) = source.get(comment_key..declaration_start) else {
        return false;
    };

    before_key.trim().is_empty()
        && matches!(
            before_declaration
                .split_whitespace()
                .collect::<Vec<_>>()
                .join(" ")
                .as_str(),
            "export" | "export declare"
        )
}

fn build_jsdoc_file_cache(parsed: &ParsedModule) -> JsdocFileCache {
    let mut candidates = vec![];
    let mut direct_descriptions_by_key = BTreeMap::new();

    for entry in parsed.comments.leading.iter() {
        let key_pos = entry.key().0;
        for comment in entry.value().iter() {
            if !is_jsdoc_comment(comment) {
                continue;
            }
            let Some(description) = clean_jsdoc_comment(&comment.text) else {
                continue;
            };
            direct_descriptions_by_key
                .entry(key_pos)
                .or_insert_with(Vec::new)
                .push(description.clone());
            candidates.push(JsdocCandidate {
                key_pos,
                end_pos: comment.span.hi.0,
                description,
            });
        }
    }

    candidates.sort_by_key(|it| (it.end_pos, it.key_pos));

    JsdocFileCache {
        candidates,
        direct_descriptions_by_key,
        resolved_by_span_lo: BTreeMap::new(),
    }
}

fn find_cached_jsdoc_description(
    cache: &JsdocFileCache,
    source: &str,
    source_start: u32,
    declaration_pos: u32,
) -> Option<String> {
    if let Some(descriptions) = cache.direct_descriptions_by_key.get(&declaration_pos)
        && let Some(description) = descriptions.last()
    {
        return Some(description.clone());
    }

    let mut low = 0;
    let mut high = cache.candidates.len();
    while low < high {
        let mid = (low + high) / 2;
        if cache.candidates[mid].end_pos <= declaration_pos {
            low = mid + 1;
        } else {
            high = mid;
        }
    }

    let candidate = low
        .checked_sub(1)
        .and_then(|index| cache.candidates.get(index))?;
    if jsdoc_candidate_matches_declaration(candidate, source, source_start, declaration_pos) {
        Some(candidate.description.clone())
    } else {
        None
    }
}

impl<'a, R: FileManager> FrontendCtx<'a, R> {
    fn jsdoc_description(&mut self, file: &BffFileName, span: Span) -> Option<String> {
        let span_lo = span.lo.0;
        if let Some(cached) = self
            .jsdoc_cache_by_file
            .get(file)
            .and_then(|cache| cache.resolved_by_span_lo.get(&span_lo))
        {
            return cached.clone();
        }

        let parsed = self.files.get_existing_file(file)?;
        if !self.jsdoc_cache_by_file.contains_key(file) {
            self.jsdoc_cache_by_file
                .insert(file.clone(), build_jsdoc_file_cache(&parsed));
        }

        let source_start = parsed.module.fm.start_pos.0;
        let source = parsed.module.fm.src.as_str();
        let description = self
            .jsdoc_cache_by_file
            .get(file)
            .and_then(|cache| find_cached_jsdoc_description(cache, source, source_start, span_lo));

        if let Some(cache) = self.jsdoc_cache_by_file.get_mut(file) {
            cache
                .resolved_by_span_lo
                .insert(span_lo, description.clone());
        }

        description
    }

    pub(super) fn with_jsdoc(&mut self, file: &BffFileName, span: Span, runtype: Runtype) -> Runtype {
        match self.jsdoc_description(file, span) {
            Some(description) => runtype.with_description(description),
            None => runtype,
        }
    }
}
